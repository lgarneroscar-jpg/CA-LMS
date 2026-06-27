import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateCohortStartDate, unlockInstitutionWeek, setInstitutionFullyUnlocked } from "@/app/actions/cohort-controls";
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

export default async function SuperAdminPage() {
  await requireRole(["super_admin"]);
  const supabase = await createClient();

  const { count: institutionCount } = await supabase
    .from("institutions")
    .select("*", { count: "exact", head: true });

  const { count: studentCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student");

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
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Super Admin</h1>
        <p className="text-muted-foreground">
          Platform overview — full management tools arrive in Phase 5.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Institutions</CardDescription>
            <CardTitle className="text-3xl">{institutionCount ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create institutions in Supabase or via the roster tool (Phase 5).
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Students</CardDescription>
            <CardTitle className="text-3xl">{studentCount ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Upload rosters and manage users in Phase 5.
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
              Edit videos, workbook content, exercises, quizzes, and live session URLs.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cohort management</CardTitle>
          <CardDescription>
            Control pacing without editing the database directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(institutions ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No institutions yet.
            </p>
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
                      <p className="font-semibold">{inst.name}</p>
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
                          defaultValue={inst.is_fully_unlocked ? 1 : Math.max(1, inst.cohort_start_date ? 1 : 1)}
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
