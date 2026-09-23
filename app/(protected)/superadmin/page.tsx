import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  updateCohortStartDate,
  unlockInstitutionWeek,
  setInstitutionFullyUnlocked,
} from "@/app/actions/cohort-controls";
import { getCrossInstitutionOverview } from "@/lib/cross-institution-overview";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function pct(value: number | null): string {
  if (value == null) return "—";
  return `${value}%`;
}

export default async function SuperAdminPage() {
  await requireRole(["super_admin"]);
  const supabase = await createClient();

  const [overview, { count: institutionCount }, { count: studentCount }] =
    await Promise.all([
      getCrossInstitutionOverview(),
      supabase.from("institutions").select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student")
        .eq("is_demo", false),
    ]);

  const { data: institutions } = await supabase
    .from("institutions")
    .select("id, name, cohort_start_date, drip_type, is_fully_unlocked")
    .order("name");

  const { data: unlockedRows } = await supabase
    .from("institution_unlocked_weeks")
    .select("institution_id, week_number")
    .order("week_number");

  const overridesByInstitution = new Map<string, number[]>();
  (unlockedRows ?? []).forEach((r) => {
    const list = overridesByInstitution.get(r.institution_id) ?? [];
    list.push(r.week_number);
    overridesByInstitution.set(r.institution_id, list);
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Super Admin</h1>
          <p className="text-muted-foreground">
            How every cohort is doing — demo students excluded from totals.
          </p>
        </div>
        <Link
          href="/superadmin/institutions/new"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create institution
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Institutions</CardDescription>
            <CardTitle className="text-3xl">{institutionCount ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/superadmin/institutions"
              className="text-sm font-medium underline hover:text-foreground"
            >
              Manage institutions & rosters
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Students (excl. demo)</CardDescription>
            <CardTitle className="text-3xl">{studentCount ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Invite via institution roster upload — students set their own
              password.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Content</CardDescription>
            <CardTitle className="text-lg">
              <Link href="/superadmin/content" className="hover:underline">
                Module & live session editor
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Edit videos, workbook content, exercises, quizzes, and live session
              URLs.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cross-institution overview</CardTitle>
          <CardDescription>
            One row per institution. Demo students (`is_demo`) are excluded from
            cohort size and averages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overview.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No institutions yet.{" "}
              <Link
                href="/superadmin/institutions/new"
                className="underline hover:text-foreground"
              >
                Create one
              </Link>
              .
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 font-medium">Institution</th>
                    <th className="px-3 py-2 font-medium">Cohort</th>
                    <th className="px-3 py-2 font-medium">Week</th>
                    <th className="px-3 py-2 font-medium">Keeping pace</th>
                    <th className="px-3 py-2 font-medium">Modules passed</th>
                    <th className="px-3 py-2 font-medium">Workbook</th>
                    <th className="px-3 py-2 font-medium">Attention</th>
                    <th className="px-3 py-2 font-medium">Last report</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-3 py-2">
                        <Link
                          href={`/superadmin/institutions/${row.id}`}
                          className="font-medium underline hover:text-foreground"
                        >
                          {row.name}
                        </Link>
                        {row.is_pilot ? (
                          <Badge variant="secondary" className="ml-2">
                            Pilot
                          </Badge>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">{row.cohortSize}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.displayWeek != null
                          ? `W${row.displayWeek}`
                          : row.cohortWeekLabel}
                      </td>
                      <td className="px-3 py-2">
                        {pct(row.keepingPaceAverage)}
                      </td>
                      <td className="px-3 py-2">
                        {pct(row.modulesPassedAverage)}
                      </td>
                      <td className="px-3 py-2">
                        {pct(row.workbookAverage)}
                      </td>
                      <td className="px-3 py-2">{row.needingAttention}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {formatDate(row.lastReportAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cohort pacing controls</CardTitle>
          <CardDescription>
            Control drip unlocking without editing the database directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(institutions ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No institutions yet.</p>
          ) : (
            (institutions ?? []).map((inst) => {
              const unlockedWeeks = overridesByInstitution.get(inst.id) ?? [];

              return (
                <div
                  key={inst.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <Link
                        href={`/superadmin/institutions/${inst.id}`}
                        className="font-semibold underline hover:text-foreground"
                      >
                        {inst.name}
                      </Link>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{inst.drip_type}</Badge>
                        {inst.is_fully_unlocked && (
                          <Badge className="bg-accent text-accent-foreground">
                            Fully unlocked
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    <form action={updateCohortStartDate} className="space-y-2">
                      <input
                        type="hidden"
                        name="institutionId"
                        value={inst.id}
                      />
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          Cohort start date
                        </label>
                        <Input
                          type="date"
                          name="cohortStartDate"
                          defaultValue={inst.cohort_start_date ?? ""}
                        />
                      </div>
                      <Button type="submit">Update date</Button>
                    </form>

                    <form
                      action={setInstitutionFullyUnlocked}
                      className="space-y-2"
                    >
                      <input
                        type="hidden"
                        name="institutionId"
                        value={inst.id}
                      />
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="isFullyUnlocked"
                          value="true"
                          defaultChecked={inst.is_fully_unlocked}
                        />
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">
                            Fully unlocked mode
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Bypass weekly drip locks.
                          </p>
                        </div>
                      </div>
                      <Button type="submit" variant="secondary">
                        Save
                      </Button>
                    </form>

                    <form action={unlockInstitutionWeek} className="space-y-2">
                      <input
                        type="hidden"
                        name="institutionId"
                        value={inst.id}
                      />
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          Unlock a week early
                        </label>
                        <select
                          name="weekNumber"
                          defaultValue={1}
                          className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                          disabled={inst.is_fully_unlocked}
                        >
                          {Array.from({ length: 12 }).map((_, idx) => {
                            const w = idx + 1;
                            return (
                              <option key={w} value={w}>
                                Week {w}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <Button type="submit" disabled={inst.is_fully_unlocked}>
                        Unlock week
                      </Button>

                      {unlockedWeeks.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Manually unlocked:{" "}
                          {unlockedWeeks.sort((a, b) => a - b).join(", ")}
                        </p>
                      )}
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
