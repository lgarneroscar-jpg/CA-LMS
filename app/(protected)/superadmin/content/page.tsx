import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getModuleContentStatus } from "@/lib/seed-to-db";
import { PILLARS } from "@/types/modules";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={
        ok
          ? "text-xs font-medium text-emerald-700"
          : "text-xs font-medium text-amber-700"
      }
    >
      {label}: {ok ? "✓" : "—"}
    </span>
  );
}

export default async function ContentAdminPage() {
  await requireRole(["super_admin"]);
  const supabase = await createClient();

  const { data: modules } = await supabase
    .from("modules")
    .select(
      "id, module_code, title, slug, pillar, unlock_week, order_index, video_url, stream_url, workbook_content, exercises, is_live_session"
    )
    .eq("is_live_session", false)
    .order("unlock_week")
    .order("order_index");

  const moduleIds = (modules ?? []).map((m) => m.id);
  const quizCounts = new Map<string, number>();

  if (moduleIds.length > 0) {
    const { data: quizRows } = await supabase
      .from("quiz_questions")
      .select("module_id")
      .in("module_id", moduleIds);

    (quizRows ?? []).forEach((row) => {
      quizCounts.set(row.module_id, (quizCounts.get(row.module_id) ?? 0) + 1);
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Content management
          </h1>
          <p className="text-muted-foreground">
            Edit module videos, workbook content, exercises, and quizzes.
          </p>
        </div>
        <Link
          href="/superadmin/content/live-sessions"
          className="inline-flex h-8 items-center rounded-lg bg-secondary px-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
        >
          Live sessions
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modules ({modules?.length ?? 0})</CardTitle>
          <CardDescription>
            P1–P14 curriculum modules with workbook content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!modules?.length ? (
            <p className="text-sm text-muted-foreground">
              No modules found. Run the content seed to populate P1–P14.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {modules.map((module) => {
                const status = getModuleContentStatus({
                  ...module,
                  quiz_count: quizCounts.get(module.id) ?? 0,
                });
                const pillarLabel =
                  PILLARS[module.pillar as keyof typeof PILLARS]?.label ??
                  `Pillar ${module.pillar}`;

                return (
                  <li
                    key={module.id}
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold">
                          {module.module_code}
                        </span>
                        <Badge variant="secondary">Week {module.unlock_week}</Badge>
                        <Badge variant="outline">{pillarLabel}</Badge>
                      </div>
                      <p className="font-medium">{module.title}</p>
                      <div className="flex flex-wrap gap-3">
                        <StatusDot ok={status.hasVideo} label="Video" />
                        <StatusDot ok={status.hasWorkbook} label="Workbook" />
                        <StatusDot ok={status.hasExercises} label="Exercises" />
                        <StatusDot
                          ok={status.quizCount >= 5}
                          label={`Quiz (${status.quizCount})`}
                        />
                      </div>
                    </div>
                    <Link
                      href={`/superadmin/content/${module.id}`}
                      className="inline-flex h-7 items-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
                    >
                      Edit
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
