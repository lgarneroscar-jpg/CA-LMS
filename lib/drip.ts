/**
 * Legacy calendar-week helper (admin cohort analytics).
 * Student content access is no longer gated by calendar week.
 */

export function getProgramWeek(
  anchorDate: string | null,
  now: Date = new Date()
): number {
  if (!anchorDate) return 0;

  const start = new Date(anchorDate.includes("T") ? anchorDate : anchorDate + "T00:00:00");
  if (Number.isNaN(start.getTime())) return 0;

  const today = new Date(now.toDateString());
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSinceStart = Math.floor(
    (today.getTime() - start.getTime()) / msPerDay
  );

  if (daysSinceStart < 0) return 0;

  return Math.floor(daysSinceStart / 7) + 1;
}

export function isModuleUnlocked(
  unlockWeek: number,
  currentWeek: number,
  dripType: string = "weekly"
): boolean {
  if (currentWeek === 0) return false;
  if (dripType === "async") return true;
  return unlockWeek <= currentWeek;
}

/** Students: open access after diagnostic. Timeline does not gate content. */
export function isModuleUnlockedByRules(params: {
  unlockWeek: number;
  currentWeek: number;
  dripType: string;
  isDemo: boolean;
  isFullyUnlocked: boolean;
  unlockedWeeks: Set<number>;
  diagnosticComplete?: boolean;
}): boolean {
  const { diagnosticComplete = true } = params;
  if (!diagnosticComplete) return false;
  return true;
}

export function isWeekUnlockedByRules(params: {
  weekNumber: number;
  currentWeek: number;
  dripType: string;
  isDemo: boolean;
  isFullyUnlocked: boolean;
  unlockedWeeks: Set<number>;
  diagnosticComplete?: boolean;
}): boolean {
  return isModuleUnlockedByRules({
    unlockWeek: params.weekNumber,
    currentWeek: params.currentWeek,
    dripType: params.dripType,
    isDemo: params.isDemo,
    isFullyUnlocked: params.isFullyUnlocked,
    unlockedWeeks: params.unlockedWeeks,
    diagnosticComplete: params.diagnosticComplete,
  });
}

export function getUnlockLabel(unlockWeek: number): string {
  return `Week ${unlockWeek}`;
}

export function daysUntilWeekUnlock(
  cohortStartDate: string,
  unlockWeek: number
): number {
  const start = new Date(cohortStartDate + "T00:00:00");
  const unlockDay = (unlockWeek - 1) * 7;
  const unlockDate = new Date(start.getTime() + unlockDay * 24 * 60 * 60 * 1000);
  const today = new Date(new Date().toDateString());
  return Math.max(
    0,
    Math.ceil((unlockDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  );
}
