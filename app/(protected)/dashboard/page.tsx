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

export default async function StudentDashboardPage() {
  const profile = await requireRole(["student"]);
  const programStartedAt = profile.program_started_at ?? null;
  const diagnosticComplete = profile.diagnostic_complete || profile.is_demo;
  const firstName = profile.full_name?.split(" ")[0] ?? null;

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
    <div className="experience-lift mx-auto max-w-5xl space-y-10 pb-12">
      <header className="lift-framework space-y-6 rounded-3xl p-7 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            {institution?.name ? (
              <span className="lift-chip inline-flex">{institution.name}</span>
            ) : (
              <span className="lift-chip inline-flex">Your program</span>
            )}
            <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-[2.5rem] md:leading-tight">
              {firstName ? firstName : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Built for Career Success
            </p>
          </div>
          {!programStartedAt && diagnosticComplete ? (
            <StartProgramButton />
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Program progress</span>
            <span>
              {completedCount} of {totalModules} modules complete
            </span>
          </div>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="lift-progress-fill absolute inset-y-0 left-0 rounded-full bg-lift"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      </header>

      {profile.program_completed_at ? (
        <ProgramCompletionBanner studentId={profile.id} />
      ) : null}

      {!profile.institution_id && (
        <div className="lift-card rounded-2xl p-5 text-sm">
          Link your account to an institution in Supabase to enable cohort
          features.
        </div>
      )}

      {!programStartedAt && diagnosticComplete ? (
        <div className="lift-card space-y-3 rounded-2xl border-lift/20 p-6">
          <h2 className="text-lg font-semibold">Ready to begin?</h2>
          <p className="text-sm text-muted-foreground">
            Click Go when you&apos;re ready. Your program clock starts then —
            all modules are open, and your timeline advances as you complete
            work.
          </p>
          <StartProgramButton />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="lift-card rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Total XP
          </p>
          <p className="mt-2 text-3xl font-semibold text-accent">{profile.xp}</p>
        </div>
        <div className="lift-card rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Streak
          </p>
          <p className="mt-2 text-3xl font-semibold text-lift">
            {profile.streak_days}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">weeks</p>
        </div>
        <div className="lift-card rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Rank
          </p>
          <p className="mt-2 text-base font-semibold leading-snug text-accent">
            {profile.rank
              ? formatRankMessage(profile.rank)
              : "Complete modules to rank"}
          </p>
        </div>
      </div>

      {programStartedAt ? (
        <PaceIndicator
          programStartedAt={programStartedAt}
          progressWeek={feedWeek}
          lastLogin={profile.last_login}
        />
      ) : null}

      <section className="lift-framework rounded-3xl p-6 md:p-7">
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">
            Your program
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Last week, this week, and next week — based on your progress, not the
            calendar. Live sessions appear as milestones and do not block
            completion.
          </p>
        </div>
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
      </section>

      {nextModule ? <ContinueLearning nextModule={nextModule} /> : null}

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/program" className="underline hover:text-foreground">
          View full curriculum
        </Link>
      </p>
    </div>
  );
}
