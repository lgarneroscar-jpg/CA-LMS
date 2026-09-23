import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCohortAnalytics } from "@/lib/cohort-analytics";
import {
  formatAverageQuizScoreLabel,
  pluralize,
  METRIC_DEFINITIONS,
} from "@/lib/admin-reporting";
import { moduleCompletionExplainer } from "@/lib/module-gates";
import { PaceGauge } from "@/components/admin/pace-gauge";
import {
  AdminDashboardReporting,
  DiagnosticSummary,
  ModuleCompletionBarList,
} from "@/components/admin/admin-dashboard-reporting";
import { LiveSessionAttendanceSummary } from "@/components/admin/live-session-attendance-summary";
import { GenerateReportButton } from "@/components/admin/generate-report-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PageProps = {
  params: Promise<{ "institution-id": string }>;
};

function metricLabel(value: number | null | undefined, suffix = ""): string {
  if (value == null) return "— · no data yet";
  return `${value}${suffix}`;
}

export default async function AdminDashboardPage({ params }: PageProps) {
  const { "institution-id": institutionId } = await params;
  const profile = await requireRole(["institutional_admin", "super_admin"]);

  if (
    profile.role === "institutional_admin" &&
    profile.institution_id !== institutionId
  ) {
    return null;
  }

  const supabase = await createClient();
  const analytics = await getCohortAnalytics(supabase, institutionId);

  const { data: institution } = await supabase
    .from("institutions")
    .select("name, reporting_cadence, is_pilot")
    .eq("id", institutionId)
    .single();

  if (!analytics) {
    return (
      <p className="text-muted-foreground">Unable to load cohort analytics.</p>
    );
  }

  const studentNames = Object.fromEntries(
    analytics.allStudents.map((s) => [s.id, s.full_name ?? "Unnamed"])
  );
  const studentCount = analytics.allStudents.length;
  const preStart = analytics.cohortPhase === "pre_start";
  const early = analytics.cohortPhase === "early";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {institution?.name ?? "Institution"} Dashboard
          </h1>
          <p className="text-muted-foreground">
            {analytics.cohortWeekLabel} · {studentCount}{" "}
            {pluralize(studentCount, "student")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/${institutionId}/reports`}
            className="inline-flex h-8 items-center rounded-lg border px-2.5 text-sm font-medium hover:bg-muted"
          >
            Reports
          </Link>
          <a
            href={`/api/admin/${institutionId}/export`}
            className="inline-flex h-8 items-center rounded-lg bg-secondary px-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            Export CSV
          </a>
        </div>
      </div>

      {preStart ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Cohort starts in {analytics.daysUntilStart}{" "}
          {pluralize(analytics.daysUntilStart, "day")} — no activity expected
          yet. Pace and attention lists are suppressed until the programme
          begins.
        </div>
      ) : null}

      {early ? (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Early cohort (weeks 1–2): showing participation and baseline
          completion. Students are not flagged as behind pace yet.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Pace tracker</CardTitle>
            <CardDescription>
              {preStart || early
                ? "Not shown until week 3"
                : "Target vs actual cohort pace"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.pacePercent == null ? (
              <p className="text-sm text-muted-foreground">— · no data yet</p>
            ) : (
              <PaceGauge
                targetWeek={analytics.targetWeek}
                pacePercent={analytics.pacePercent}
              />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cohort health</CardTitle>
            <CardDescription>{moduleCompletionExplainer()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <HealthCard
                label="Keeping pace"
                value={metricLabel(analytics.paceCompletionRate, "%")}
                definition={METRIC_DEFINITIONS.paceCompletion(
                  analytics.averageExpectedModuleCount
                )}
              />
              <HealthCard
                label={`Modules passed (avg of ${analytics.totalContentModules})`}
                value={metricLabel(analytics.overallCompletionRate, "%")}
                definition={METRIC_DEFINITIONS.overallCompletion(
                  analytics.totalContentModules
                )}
              />
              <HealthCard
                label="Avg quiz score"
                value={formatAverageQuizScoreLabel(
                  analytics.averageQuizScore,
                  analytics.quizScoreStudentCount,
                  analytics.allStudents.length
                )}
                definition={METRIC_DEFINITIONS.quizScore}
              />
              <HealthCard
                label="Avg workbook completion"
                value={metricLabel(
                  analytics.averageWorkbookCompletionPercent,
                  "%"
                )}
                definition={METRIC_DEFINITIONS.workbookCompletion}
              />
              <HealthCard
                label="No workbook activity"
                value={
                  preStart
                    ? "— · no data yet"
                    : `${analytics.studentsWithZeroWorkbookActivity} ${pluralize(analytics.studentsWithZeroWorkbookActivity, "student")}`
                }
                definition="Enrolled students who have not answered a single workbook exercise."
              />
              <HealthCard
                label="Avg XP"
                value={metricLabel(analytics.averageXp)}
                definition={METRIC_DEFINITIONS.averageXp(
                  analytics.topXp,
                  analytics.topXpStudentName
                )}
              />
              <HealthCard
                label="Weekly engagement"
                value={metricLabel(analytics.weeklyEngagementScore, "%")}
                definition={METRIC_DEFINITIONS.weeklyEngagement}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report snapshots</CardTitle>
          <CardDescription>
            Explicit generation only — this page never writes to reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GenerateReportButton institutionId={institutionId} />
        </CardContent>
      </Card>

      {!preStart ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>CAPRI readiness baseline</CardTitle>
              <CardDescription>
                Completion counts only — individual answers are not shown to
                admins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DiagnosticSummary
                institutionId={institutionId}
                diagnostic={analytics.diagnostic}
                totalStudents={studentCount}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live session attendance</CardTitle>
              <CardDescription>
                Tracked separately from module completion · admin-confirmed vs
                self-reported
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LiveSessionAttendanceSummary
                institutionId={institutionId}
                rates={analytics.liveSessionAttendanceRates}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cohort rankings &amp; roster</CardTitle>
              <CardDescription>
                Filter by attention reason · {moduleCompletionExplainer()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminDashboardReporting
                institutionId={institutionId}
                analytics={analytics}
                studentNames={studentNames}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Module completion breakdown</CardTitle>
              <CardDescription>
                Quiz-passed modules in curriculum order · click a row to expand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModuleCompletionBarList
                institutionId={institutionId}
                modules={analytics.moduleCompletionRates}
                studentNames={studentNames}
              />
            </CardContent>
          </Card>
        </>
      ) : null}

      <p className="text-center text-sm">
        <Link
          href={`/admin/${institutionId}/students`}
          className="underline hover:text-foreground"
        >
          View full student roster →
        </Link>
      </p>
    </div>
  );
}

function HealthCard({
  label,
  value,
  definition,
}: {
  label: string;
  value: string;
  definition?: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {definition ? (
        <p className="mt-1 text-xs leading-snug text-muted-foreground">
          {definition}
        </p>
      ) : null}
    </div>
  );
}
