import Link from "next/link";
import { requireRole, getAuthContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildProgramFeed, findNextModule, getProgressWeek } from "@/lib/program";
import {
  getContentModuleCatalog,
  getTimelineModuleCatalog,
  getStudentProgressMap,
} from "@/lib/modules-queries";
import { notifyBehindPaceIfNeeded } from "@/lib/behind-pace";
import { formatRankMessage } from "@/lib/rankings";
import { ProgramFeed } from "@/components/dashboard/program-feed";
import { ContinueLearning } from "@/components/dashboard/continue-learning";
import { ProgramCompletionBanner } from "@/components/dashboard/program-completion-banner";
import { StartProgramButton } from "@/components/dashboard/start-program-button";
import { PaceIndicator } from "@/components/dashboard/pace-indicator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function StudentDashboardPage() {
  const profile = await requireRole(["student"]);
  const programStartedAt = profile.program_started_at ?? null;
  const diagnosticComplete = profile.diagnostic_complete || profile.is_demo;

  const [institutionResult, contentModules, timelineModules, progressMap, auth] =
    await Promise.all([
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
      getTimelineModuleCatalog(),
      getStudentProgressMap(profile.id),
      getAuthContext(),
    ]);

  const institution = institutionResult.data;

  if (programStartedAt) {
    const progressWeek = getProgressWeek(contentModules, progressMap);
    void notifyBehindPaceIfNeeded(await createClient(), {
      studentId: profile.id,
      studentEmail: auth.user?.email ?? null,
      studentName: profile.full_name,
      programStartedAt,
      progressWeek,
    });
  }

  const contentIds = new Set(contentModules.map((m) => m.id));
  const completedCount = [...progressMap.entries()].filter(
    ([id, p]) => contentIds.has(id) && p.is_complete
  ).length;
  const totalModules = contentModules.length;
  const percentComplete =
    totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  const { currentWeek: feedWeek, weeks, maxWeek } = buildProgramFeed({
    modules: timelineModules,
    progressByModuleId: progressMap,
    programStartedAt,
    diagnosticComplete,
  });

  const flatModules = weeks.flatMap((w) => w.modules);
  const nextModule = diagnosticComplete ? findNextModule(flatModules) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Welcome back
            {profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            {institution?.name ?? "Your program"} · Built for Career Success
          </p>
        </div>
        {!programStartedAt && diagnosticComplete ? (
          <StartProgramButton />
        ) : null}
      </div>

      {profile.program_completed_at ? (
        <ProgramCompletionBanner studentId={profile.id} />
      ) : null}

      {!profile.institution_id && (
        <Card className="border-accent/40 bg-accent/5">
          <CardContent className="pt-6 text-sm">
            Link your account to an institution in Supabase to enable cohort
            features.
          </CardContent>
        </Card>
      )}

      {!programStartedAt && diagnosticComplete ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle>Ready to begin?</CardTitle>
            <CardDescription>
              Click Go when you&apos;re ready. Your program clock starts then —
              all modules are open, and your timeline advances as you complete
              work.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StartProgramButton />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Progress</CardDescription>
            <CardTitle className="text-2xl md:text-3xl">{percentComplete}%</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {completedCount} of {totalModules} modules
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total XP</CardDescription>
            <CardTitle className="text-2xl text-accent md:text-3xl">
              {profile.xp}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Streak</CardDescription>
            <CardTitle className="text-2xl md:text-3xl">
              {profile.streak_days}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">weeks</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rank</CardDescription>
            <CardTitle className="text-sm font-semibold leading-snug md:text-base">
              {profile.rank
                ? formatRankMessage(profile.rank)
                : "Complete modules to rank"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {programStartedAt ? (
        <PaceIndicator
          programStartedAt={programStartedAt}
          progressWeek={feedWeek}
          lastLogin={profile.last_login}
        />
      ) : null}

      {/* Central timeline — heart of the dashboard */}
      <Card className="overflow-hidden border-2 border-primary/10 shadow-md">
        <CardHeader className="bg-muted/40 pb-4">
          <CardTitle className="text-xl md:text-2xl">Your program</CardTitle>
          <CardDescription>
            Last week, this week, and next week — based on your progress, not the
            calendar. Live sessions appear as milestones and do not block
            completion.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {diagnosticComplete ? (
            <ProgramFeed weeks={weeks} currentWeek={feedWeek} maxWeek={maxWeek} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete the{" "}
              <Link href="/diagnostic" className="underline">
                entry diagnostic
              </Link>{" "}
              to view your timeline.
            </p>
          )}
        </CardContent>
      </Card>

      {nextModule ? <ContinueLearning nextModule={nextModule} /> : null}

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/program" className="underline hover:text-foreground">
          View full program overview
        </Link>
      </p>
    </div>
  );
}
