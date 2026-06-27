import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FlagStudentForm } from "@/components/admin/flag-student-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PageProps = {
  params: Promise<{ "institution-id": string; "student-id": string }>;
};

export default async function AdminStudentDetailPage({ params }: PageProps) {
  const { "institution-id": institutionId, "student-id": studentId } =
    await params;
  const profile = await requireRole(["institutional_admin", "super_admin"]);

  if (
    profile.role === "institutional_admin" &&
    profile.institution_id !== institutionId
  ) {
    return null;
  }

  const supabase = await createClient();

  const { data: student } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .eq("institution_id", institutionId)
    .eq("role", "student")
    .single();

  if (!student) notFound();

  const { data: flag } = await supabase
    .from("flags")
    .select("note, created_at")
    .eq("student_id", studentId)
    .maybeSingle();

  const { data: modules } = await supabase
    .from("modules")
    .select("id, module_code, title, is_live_session")
    .order("unlock_week")
    .order("order_index");

  const { data: progress } = await supabase
    .from("student_progress")
    .select("*")
    .eq("student_id", studentId);

  const { data: diagnostic } = await supabase
    .from("diagnostic_responses")
    .select("question_key, response")
    .eq("student_id", studentId);

  const { data: quizCounts } = await supabase
    .from("quiz_questions")
    .select("module_id");

  const quizTotalByModule = new Map<string, number>();
  (quizCounts ?? []).forEach((q) => {
    quizTotalByModule.set(
      q.module_id,
      (quizTotalByModule.get(q.module_id) ?? 0) + 1
    );
  });

  const progressByModule = new Map(
    (progress ?? []).map((p) => [p.module_id, p])
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={`/admin/${institutionId}/students`}
          className="text-sm text-muted-foreground underline"
        >
          ← Back to roster
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">
          {student.full_name ?? "Unnamed student"}
        </h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary">{student.xp} XP</Badge>
          <Badge variant="outline">Rank {student.rank ?? "—"}</Badge>
          {flag ? <Badge variant="destructive">Flagged</Badge> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last login</CardDescription>
            <CardTitle className="text-base font-medium">
              {student.last_login
                ? new Date(student.last_login).toLocaleString()
                : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Streak</CardDescription>
            <CardTitle className="text-base font-medium">
              {student.streak_days} weeks
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module history</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border text-sm">
            {(modules ?? []).map((mod) => {
              const row = progressByModule.get(mod.id);
              const quizTotal = quizTotalByModule.get(mod.id) ?? 0;
              return (
                <li
                  key={mod.id}
                  className="flex flex-col gap-1 py-2 sm:flex-row sm:justify-between"
                >
                  <span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {mod.module_code}
                    </span>{" "}
                    {mod.title}
                  </span>
                  <span className="text-muted-foreground">
                    {row?.is_complete
                      ? `Complete · ${row.completed_at ? new Date(row.completed_at).toLocaleDateString() : ""}${
                          quizTotal > 0
                            ? ` · Quiz ${row.quiz_score}/${quizTotal}`
                            : ""
                        }`
                      : "Not complete"}
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {diagnostic && diagnostic.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic responses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {diagnostic.map((d) => (
              <div key={d.question_key}>
                <p className="font-medium capitalize">
                  {d.question_key.replace(/_/g, " ")}
                </p>
                <p className="text-muted-foreground">{d.response}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <FlagStudentForm
        institutionId={institutionId}
        studentId={studentId}
        existingNote={flag?.note ?? null}
        isFlagged={Boolean(flag)}
      />
    </div>
  );
}
