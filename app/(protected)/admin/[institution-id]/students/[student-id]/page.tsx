import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getCohortAnalytics,
  getStudentModuleBreakdown,
} from "@/lib/cohort-analytics";
import { formatWorkbookActivityLabel } from "@/lib/admin-reporting";
import { FlagStudentForm } from "@/components/admin/flag-student-form";
import {
  formatQuizScoreDisplay,
  isLowQuizScore,
} from "@/lib/workbook-activity";
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

  const [analytics, moduleBreakdown, flagResult, diagnosticResult] =
    await Promise.all([
      getCohortAnalytics(supabase, institutionId),
      getStudentModuleBreakdown(supabase, institutionId, studentId),
      supabase
        .from("flags")
        .select("note, created_at")
        .eq("student_id", studentId)
        .maybeSingle(),
      supabase
        .from("diagnostic_responses")
        .select("question_key, response")
        .eq("student_id", studentId),
    ]);

  const flag = flagResult.data;
  const diagnostic = diagnosticResult.data;
  const studentMetrics = analytics?.allStudents.find((s) => s.id === studentId);

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
          {studentMetrics ? (
            <>
              <Badge variant="outline">
                Completion {studentMetrics.completionPercent}%
              </Badge>
              <Badge variant="outline">
                Live sessions {studentMetrics.liveAttendance.attendedCount} of{" "}
                {studentMetrics.liveAttendance.total}
              </Badge>
              <Badge variant="outline">
                {formatWorkbookActivityLabel(studentMetrics)}
              </Badge>
            </>
          ) : null}
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
          <CardDescription>
            Workbook counts only — answer content is never shown to admins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border text-sm">
            {(moduleBreakdown ?? []).map((mod) => {
              // QUIZ_SCORE_IS_RAW_COUNT — quiz_score is correct answers, not a percentage.
              const quizDisplay = formatQuizScoreDisplay(
                mod.quizScore,
                mod.quizTotal
              );
              const lowQuiz = isLowQuizScore(mod.quizScore, mod.quizTotal);

              return (
                <li
                  key={mod.moduleId}
                  className="flex flex-col gap-1 py-2 sm:flex-row sm:items-start sm:justify-between"
                >
                  <span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {mod.moduleCode}
                    </span>{" "}
                    {mod.title}
                  </span>
                  <span className="text-right text-muted-foreground">
                    {mod.isLiveSession ? (
                      mod.isComplete ? "Attended" : "Not attended"
                    ) : (
                      <span className="inline-flex flex-col items-end gap-1">
                        {mod.isComplete ? (
                          <span>Complete</span>
                        ) : (
                          <span>Not complete</span>
                        )}
                        {mod.exercisesTotal > 0 ? (
                          <span>
                            Workbook {mod.exercisesAnswered} of{" "}
                            {mod.exercisesTotal}
                          </span>
                        ) : null}
                        {quizDisplay ? (
                          <span
                            className={
                              lowQuiz ? "font-medium text-amber-700" : undefined
                            }
                          >
                            Quiz {quizDisplay}
                            {lowQuiz ? " · below 50%" : ""}
                          </span>
                        ) : null}
                      </span>
                    )}
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
