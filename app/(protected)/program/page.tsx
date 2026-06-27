import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPillarSlug, getPillarLabel, getProgressWeek } from "@/lib/program";
import {
  getContentModuleCatalog,
  getStudentProgressMap,
} from "@/lib/modules-queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

export default async function ProgramPage() {
  const profile = await requireRole(["student"]);

  const [institutionResult, modules, progressMap] = await Promise.all([
    profile.institution_id
      ? createClient().then((supabase) =>
          supabase
            .from("institutions")
            .select("name")
            .eq("id", profile.institution_id!)
            .single()
        )
      : Promise.resolve({ data: null }),
    getContentModuleCatalog(),
    getStudentProgressMap(profile.id),
  ]);

  const institution = institutionResult.data;
  const ordered = [...modules].sort(
    (a, b) =>
      (a.unlock_week ?? 1) - (b.unlock_week ?? 1) ||
      (a.order_index ?? 0) - (b.order_index ?? 0)
  );
  const progressWeek = getProgressWeek(modules, progressMap);
  const diagnosticComplete = profile.diagnostic_complete || profile.is_demo;

  const byPillar = [1, 2, 3].map((pillar) => ({
    pillar,
    label: getPillarLabel(pillar),
    slug: getPillarSlug(pillar) ?? "program",
    modules: ordered.filter((m) => m.pillar === pillar),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Program</h1>
        <p className="text-muted-foreground">
          {institution?.name ?? "Corporate Academy"} ·{" "}
          {profile.program_started_at
            ? `You are on Week ${progressWeek}`
            : "Click Go on your dashboard to start"}
        </p>
      </div>

      {!diagnosticComplete ? (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6 text-sm">
            Complete the entry diagnostic to access module content.{" "}
            <Link href="/diagnostic" className="font-medium underline">
              Go to diagnostic
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {byPillar.map(({ pillar, label, slug, modules: pillarModules }) => (
        <Card key={pillar}>
          <CardHeader>
            <CardTitle>{label}</CardTitle>
            <CardDescription>Pillar {pillar}</CardDescription>
          </CardHeader>
          <CardContent>
            {pillarModules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No modules in this pillar.</p>
            ) : (
              <ul className="space-y-1">
                {pillarModules.map((m) => {
                  const complete = progressMap.get(m.id)?.is_complete;
                  const pillarSlug = slug;
                  const moduleSlug = m.slug ?? m.id;

                  if (!diagnosticComplete) {
                    return (
                      <li
                        key={m.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 text-muted-foreground"
                      >
                        <span className="font-mono text-xs">{m.module_code}</span>
                        <span>· {m.title}</span>
                      </li>
                    );
                  }

                  return (
                    <li key={m.id}>
                      <Link
                        href={`/program/${pillarSlug}/${moduleSlug}`}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted"
                      >
                        {complete ? (
                          <CheckCircle2 className="size-4 shrink-0 text-accent" />
                        ) : null}
                        <span className="font-mono text-xs text-muted-foreground">
                          {m.module_code}
                        </span>
                        <span>· {m.title}</span>
                        {complete ? (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            Done
                          </Badge>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}

      <p className="text-sm text-muted-foreground">
        <Link href="/dashboard" className="underline hover:text-foreground">
          ← Back to dashboard timeline
        </Link>
      </p>
    </div>
  );
}
