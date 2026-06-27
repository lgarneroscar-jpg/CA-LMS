import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCohortAnalytics } from "@/lib/cohort-analytics";
import { maybeGenerateReportSnapshot } from "@/lib/reports";
import { PaceGauge } from "@/components/admin/pace-gauge";
import {
  CohortRankingsList,
  ModuleCompletionDonut,
} from "@/components/admin/admin-dashboard-client";
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

export default async function AdminDashboardPage({ params }: PageProps) {
  const { "institution-id": institutionId } = await params;
  const profile = await requireRole(["institutional_admin", "super_admin"]);

  if (
    profile.role === "institutional_admin" &&
    profile.institution_id !== institutionId
  ) {
    return null;
  }

  await maybeGenerateReportSnapshot(institutionId);

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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {institution?.name ?? "Institution"} Dashboard
          </h1>
          <p className="text-muted-foreground">
            Cohort Week {analytics.currentWeek} ·{" "}
            {analytics.allStudents.length} students
          </p>
        </div>
        <a
          href={`/api/admin/${institutionId}/export`}
          className="inline-flex h-8 items-center rounded-lg bg-secondary px-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
        >
          Export CSV
        </a>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Pace tracker</CardTitle>
            <CardDescription>Target vs actual cohort pace</CardDescription>
          </CardHeader>
          <CardContent>
            <PaceGauge
              targetWeek={analytics.targetWeek}
              pacePercent={analytics.pacePercent}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cohort health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <HealthCard
                label="Overall completion"
                value={`${analytics.overallCompletionRate}%`}
              />
              <HealthCard
                label="Avg quiz score"
                value={`${analytics.averageQuizScore}%`}
              />
              <HealthCard label="Avg XP" value={`${analytics.averageXp}`} />
              <HealthCard
                label="Weekly engagement"
                value={`${analytics.weeklyEngagementScore}%`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cohort rankings</CardTitle>
          <CardDescription>
            Top performers and students more than one week behind pace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CohortRankingsList
            institutionId={institutionId}
            topStudents={analytics.topStudents}
            bottomStudents={analytics.bottomStudents}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Module completion breakdown</CardTitle>
          <CardDescription>
            Click a module slice to see who completed it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModuleCompletionDonut
            institutionId={institutionId}
            modules={analytics.moduleCompletionRates}
            studentNames={studentNames}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student roster</CardTitle>
          <CardDescription>
            <Link
              href={`/admin/${institutionId}/students`}
              className="underline hover:text-foreground"
            >
              View full roster with flags →
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Completion</th>
                  <th className="py-2 pr-4">XP</th>
                  <th className="py-2 pr-4">Rank</th>
                  <th className="py-2">Flag</th>
                </tr>
              </thead>
              <tbody>
                {analytics.allStudents.map((s) => (
                  <tr key={s.id} className="border-b border-border/60">
                    <td className="py-2 pr-4">
                      <Link
                        href={`/admin/${institutionId}/students/${s.id}`}
                        className={
                          s.hasFlag
                            ? "font-medium text-amber-700 underline"
                            : "hover:underline"
                        }
                      >
                        {s.full_name ?? "Unnamed"}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{s.completionPercent}%</td>
                    <td className="py-2 pr-4">{s.xp}</td>
                    <td className="py-2 pr-4">{s.rank ?? "—"}</td>
                    <td className="py-2">{s.hasFlag ? "Flagged" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HealthCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
