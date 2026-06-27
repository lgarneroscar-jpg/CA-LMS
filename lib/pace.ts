/**
 * Student pace is anchored to program_started_at (when they clicked Go),
 * not the institution cohort calendar.
 */

export const PROGRAM_WEEK_COUNT = 12;

export type PaceStatus = "not_started" | "on_pace" | "ahead" | "behind";

export function getExpectedWeek(
  programStartedAt: string | null,
  now: Date = new Date()
): number {
  if (!programStartedAt) return 1;

  const start = new Date(programStartedAt);
  if (Number.isNaN(start.getTime())) return 1;

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSinceStart = Math.floor(
    (now.getTime() - start.getTime()) / msPerDay
  );

  if (daysSinceStart < 0) return 1;

  return Math.min(
    PROGRAM_WEEK_COUNT,
    Math.floor(daysSinceStart / 7) + 1
  );
}

export function getPaceStatus(
  programStartedAt: string | null,
  progressWeek: number
): PaceStatus {
  if (!programStartedAt) return "not_started";

  const expected = getExpectedWeek(programStartedAt);
  if (progressWeek > expected) return "ahead";
  if (progressWeek < expected) return "behind";
  return "on_pace";
}

export function weeksBehind(
  programStartedAt: string | null,
  progressWeek: number
): number {
  if (!programStartedAt) return 0;
  return Math.max(0, getExpectedWeek(programStartedAt) - progressWeek);
}

export function formatPaceLabel(status: PaceStatus): string {
  switch (status) {
    case "ahead":
      return "Ahead of pace";
    case "behind":
      return "Behind pace";
    case "on_pace":
      return "On pace";
    default:
      return "Not started";
  }
}

export function formatRelativeDays(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;

  const days = Math.floor(
    (Date.now() - date.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  return `${weeks} weeks ago`;
}
