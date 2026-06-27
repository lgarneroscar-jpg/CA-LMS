import Link from "next/link";
import { Lock } from "lucide-react";
import { ModuleHeader } from "@/components/modules/module-header";
import { getUnlockLabel, daysUntilWeekUnlock } from "@/lib/drip";

type LockedModuleProps = {
  title: string;
  moduleCode: string;
  pillar: number;
  estimatedMinutes: number;
  unlockWeek: number;
  cohortStartDate: string | null;
};

export function LockedModule({
  title,
  moduleCode,
  pillar,
  estimatedMinutes,
  unlockWeek,
  cohortStartDate,
}: LockedModuleProps) {
  const daysLeft = cohortStartDate
    ? daysUntilWeekUnlock(cohortStartDate, unlockWeek)
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <ModuleHeader
        title={title}
        moduleCode={moduleCode}
        pillar={pillar}
        estimatedMinutes={estimatedMinutes}
        isComplete={false}
        isLocked
      />
      <div className="mt-12 flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/30 px-8 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <Lock className="size-8 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">This module is locked</h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          {getUnlockLabel(unlockWeek)}. Your cohort schedule controls when new
          content becomes available — you can see it on your timeline, but
          content stays hidden until unlock day.
        </p>
        {daysLeft !== null && daysLeft > 0 && (
          <p className="mt-4 text-sm font-medium text-accent">
            Available in approximately {daysLeft} day{daysLeft === 1 ? "" : "s"}
          </p>
        )}
        <Link
          href="/dashboard"
          className="mt-8 inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
