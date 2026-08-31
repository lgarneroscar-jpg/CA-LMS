import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCohortAnalytics } from "@/lib/cohort-analytics";
import {
  ATTENTION_REASONS,
  attentionReasonLabel,
  countAttentionReasons,
  pluralize,
  studentMatchesReasonFilter,
  type AttentionReason,
} from "@/lib/admin-reporting";
import { moduleCompletionExplainer } from "@/lib/module-gates";
import { LiveAttendanceIndicator } from "@/components/admin/live-attendance-indicator";
import { WorkbookActivityLabel } from "@/components/admin/reporting-labels";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PageProps = {
  params: Promise<{ "institution-id": string }>;
  searchParams: Promise<{ reason?: string }>;
};

function parseReasonFilter(value: string | undefined): AttentionReason | null {
  if (!value) return null;
  return ATTENTION_REASONS.includes(value as AttentionReason)
    ? (value as AttentionReason)
    : null;
}

export default async function AdminStudentsPage({
  params,
  searchParams,
}: PageProps) {
  const { "institution-id": institutionId } = await params;
  const { reason: reasonParam } = await searchParams;
  const activeReason = parseReasonFilter(reasonParam);

  await requireRole(["institutional_admin", "super_admin"]);
  const supabase = await createClient();
  const analytics = await getCohortAnalytics(supabase, institutionId);

  const allStudents = analytics?.allStudents ?? [];
  const reasonCounts = countAttentionReasons(allStudents);
  const students = activeReason
    ? allStudents.filter((student) =>
        studentMatchesReasonFilter(student, activeReason)
      )
    : allStudents;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Student roster</h1>
          <p className="text-muted-foreground">
            {students.length} of {allStudents.length}{" "}
            {pluralize(allStudents.length, "student")} shown · click a name for
            detail
          </p>
        </div>
        <a
          href={`/api/admin/${institutionId}/export`}
          className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
        >
          Export CSV
        </a>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/${institutionId}/students`}
          className={`rounded-full border px-3 py-1 text-xs ${
            !activeReason
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:bg-muted"
          }`}
        >
          All students
        </Link>
        {ATTENTION_REASONS.map((reason) => {
          const count = reasonCounts[reason];
          if (count === 0) return null;
          const isActive = activeReason === reason;
          return (
            <Link
              key={reason}
              href={
                isActive
                  ? `/admin/${institutionId}/students`
                  : `/admin/${institutionId}/students?reason=${reason}`
              }
              className={`rounded-full border px-3 py-1 text-xs ${
                isActive
                  ? "border-amber-500 bg-amber-100 text-amber-950"
                  : "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
              }`}
            >
              {attentionReasonLabel(reason)} ({count})
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roster</CardTitle>
          <CardDescription>
            Sorted by modules passed, XP, then name · {moduleCompletionExplainer()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Modules passed</th>
                    <th className="py-2 pr-4">Quiz</th>
                    <th className="py-2 pr-4">Workbook</th>
                    <th className="py-2 pr-4">Live sessions</th>
                    <th className="py-2 pr-4">XP</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr
                      key={s.id}
                      className={
                        s.hasFlag
                          ? "border-b border-amber-200 bg-amber-50/50"
                          : "border-b border-border/60"
                      }
                    >
                      <td className="py-2 pr-4">
                        <Link
                          href={`/admin/${institutionId}/students/${s.id}`}
                          className="font-medium hover:underline"
                        >
                          {s.full_name ?? "Unnamed"}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">
                        {s.modulesPassedCount} of {s.modulesPassedTotal}
                      </td>
                      <td className="py-2 pr-4">
                        {s.quizModulesPassed} of {s.modulesPassedTotal}
                      </td>
                      <td className="py-2 pr-4">
                        <WorkbookActivityLabel student={s} />
                      </td>
                      <td className="py-2 pr-4">
                        <LiveAttendanceIndicator
                          sessions={analytics?.liveSessions ?? []}
                          attendedModuleIds={s.liveAttendance.attendedModuleIds}
                          summaryLabel={s.liveAttendance.summaryLabel}
                        />
                      </td>
                      <td className="py-2 pr-4">{s.xp}</td>
                      <td className="py-2">
                        {s.hasFlag ? (
                          <Badge variant="destructive">Flagged</Badge>
                        ) : s.isBehindPace ? (
                          <Badge variant="outline">Behind pace</Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No students match this filter.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
