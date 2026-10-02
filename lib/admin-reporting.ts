import { daysSince, formatWorkbookActivityLabel } from "@/lib/workbook-activity";
import type { CohortStudentMetrics } from "@/lib/cohort-analytics";

export type AttentionReason =
  | "invite_pending"
  | "no_workbook"
  | "inactive"
  | "behind_pace"
  | "diagnostic_incomplete"
  | "low_quiz"
  | "quiz_below_threshold";

export const ATTENTION_REASONS: AttentionReason[] = [
  "invite_pending",
  "no_workbook",
  "inactive",
  "behind_pace",
  "diagnostic_incomplete",
  "low_quiz",
  "quiz_below_threshold",
];

/**
 * Any trace of coursework or sign-in. An auth timestamp can be stale or missing
 * (e.g. accounts created before sign-in tracking), so this evidence overrides
 * "invite not accepted" rather than letting the two contradict each other.
 */
export function hasRecordedActivity(student: {
  modulesPassedCount?: number;
  workbookAnswered?: number;
  xp?: number;
  quizModulesTaken?: number;
  last_login?: string | null;
  last_active_date?: string | null;
}): boolean {
  return (
    (student.modulesPassedCount ?? 0) > 0 ||
    (student.workbookAnswered ?? 0) > 0 ||
    (student.xp ?? 0) > 0 ||
    (student.quizModulesTaken ?? 0) > 0 ||
    Boolean(student.last_login) ||
    Boolean(student.last_active_date)
  );
}

export function buildAttentionReasons(
  student: Pick<
    CohortStudentMetrics,
    | "workbookAnswered"
    | "last_active_date"
    | "last_login"
    | "isBehindPace"
    | "diagnostic_complete"
    | "quizModulesTaken"
    | "quizAverage"
    | "quizBelowThresholdCount"
    | "invitePendingDays"
    | "modulesPassedCount"
    | "xp"
  >,
  now = new Date(),
  invitePendingThresholdDays = 7
): AttentionReason[] {
  const reasons: AttentionReason[] = [];

  if (
    student.invitePendingDays != null &&
    student.invitePendingDays >= invitePendingThresholdDays &&
    !hasRecordedActivity(student)
  ) {
    reasons.push("invite_pending");
  }

  if (student.workbookAnswered === 0) {
    reasons.push("no_workbook");
  }

  if (student.last_active_date) {
    const inactiveDays = daysSince(student.last_active_date, now);
    if (inactiveDays >= 7) {
      reasons.push("inactive");
    }
  }

  if (student.isBehindPace) {
    reasons.push("behind_pace");
  }

  if (!student.diagnostic_complete) {
    reasons.push("diagnostic_incomplete");
  }

  if (
    student.quizModulesTaken > 0 &&
    student.quizAverage < 50
  ) {
    reasons.push("low_quiz");
  }

  if (student.quizBelowThresholdCount > 0) {
    reasons.push("quiz_below_threshold");
  }

  return reasons;
}

export function attentionReasonLabel(reason: AttentionReason): string {
  switch (reason) {
    case "invite_pending":
      return "Invite not accepted";
    case "no_workbook":
      return "No workbook activity";
    case "inactive":
      return "Inactive";
    case "behind_pace":
      return "Behind pace";
    case "diagnostic_incomplete":
      return "Diagnostic incomplete";
    case "low_quiz":
      return "Low quiz average";
    case "quiz_below_threshold":
      return "Quiz below pass threshold";
  }
}

export function attentionReasonDetail(
  reason: AttentionReason,
  student: CohortStudentMetrics,
  now = new Date()
): string {
  switch (reason) {
    case "invite_pending":
      return student.invitePendingDays != null
        ? `Invite not accepted after ${student.invitePendingDays} days`
        : "Invite not accepted";
    case "no_workbook":
      return "No workbook activity";
    case "inactive": {
      if (!student.last_active_date) return "Inactive — no recent activity";
      const days = daysSince(student.last_active_date, now);
      return `Inactive ${days} days`;
    }
    case "behind_pace":
      return "Behind pace";
    case "diagnostic_incomplete":
      return "Diagnostic incomplete";
    case "low_quiz":
      return `Low quiz average (${student.quizAverage}%)`;
    case "quiz_below_threshold":
      return student.quizBelowThresholdCount === 1
        ? "Quiz below 75% pass threshold"
        : `${student.quizBelowThresholdCount} quizzes below 75% pass threshold`;
  }
}

export function formatAverageQuizScoreLabel(
  averageQuizScore: number | null,
  quizScoreStudentCount: number,
  totalStudents: number
): string {
  if (averageQuizScore == null || quizScoreStudentCount === 0) {
    return "—";
  }
  return `${averageQuizScore}% · ${quizScoreStudentCount} of ${totalStudents} ${pluralize(totalStudents, "student")}`;
}

/**
 * How many content modules a student was expected to have reached by a given
 * week of their own program clock.
 */
export function expectedModuleCountForWeek(
  unlockWeeks: number[],
  expectedWeek: number
): number {
  return unlockWeeks.filter((week) => week <= expectedWeek).length;
}

/**
 * Completion against what was expected by now, capped at 100.
 *
 * The cap matters: without it a student who raced ahead would pull the cohort
 * average above what any individual achieved, and "keeping pace" would stop
 * meaning what it says.
 */
export function paceCompletionPercent(
  completedCount: number,
  expectedModuleCount: number
): number {
  if (expectedModuleCount <= 0) return 0;
  return Math.min(
    100,
    Math.round((completedCount / expectedModuleCount) * 100)
  );
}

/**
 * Plain-English definitions shown under each metric.
 *
 * Every headline figure states its own formula and denominator. Two of them
 * count differently on purpose — completion includes students who never
 * started, quiz average excludes them — and that difference is disclosed
 * rather than left for a reader to discover by doing the arithmetic.
 */
export const METRIC_DEFINITIONS = {
  paceCompletion: (expectedModules: number | null) =>
    expectedModules == null
      ? "Average progress against what each student was expected to have finished by now."
      : `Average progress against what each student was expected to have finished by now (about ${expectedModules} module${expectedModules === 1 ? "" : "s"} at this point). Each student is capped at 100%, and students who have not started count as 0%.`,

  overallCompletion: (totalModules: number) =>
    `Average share of all ${totalModules} program modules completed, counting every enrolled student. Mid-program this has a ceiling — a cohort exactly on pace will read well below 100% — so read it as absolute progress, not performance.`,

  weeklyEngagement:
    "Share of enrolled students who signed in at least once in the last 7 days. It measures presence, not depth of work.",

  capriBaseline:
    "Students who have submitted the CAPRI Week 1 readiness baseline. Required before module content opens.",

  averageXp: (topXp: number | null, topName: string | null) =>
    topXp == null
      ? "Points earned across module completion, perfect quizzes, on-time work, live sessions, and streaks. Averaged over every enrolled student."
      : `Points earned across module completion, perfect quizzes, on-time work, live sessions, and streaks. Averaged over every enrolled student; the highest in this cohort is ${topXp}${topName ? ` (${topName})` : ""}.`,

  quizScore:
    "Averaged across students who have attempted at least one quiz — students with no attempts are excluded, unlike the completion figures above, which count them at 0%. Pass threshold is 75%.",

  workbookCompletion:
    "Average share of workbook exercises answered, across every enrolled student.",
} as const;

export function countAttentionReasons(
  students: Pick<CohortStudentMetrics, "attentionReasons">[]
): Record<AttentionReason, number> {
  const counts: Record<AttentionReason, number> = {
    invite_pending: 0,
    no_workbook: 0,
    inactive: 0,
    behind_pace: 0,
    diagnostic_incomplete: 0,
    low_quiz: 0,
    quiz_below_threshold: 0,
  };

  for (const student of students) {
    for (const reason of student.attentionReasons) {
      counts[reason] += 1;
    }
  }

  return counts;
}

export function studentMatchesReasonFilter(
  student: Pick<CohortStudentMetrics, "attentionReasons">,
  reason: AttentionReason | null
): boolean {
  if (!reason) return true;
  return student.attentionReasons.includes(reason);
}

export function formatLiveAttendanceSummary(params: {
  attendedCount: number;
  total: number;
  adminConfirmedCount: number;
  selfReportedCount: number;
  unit?: string;
}): string {
  const {
    attendedCount,
    total,
    adminConfirmedCount,
    selfReportedCount,
    unit = "attended",
  } = params;
  const base = `${attendedCount} of ${total} ${unit}`;
  if (attendedCount === 0) return base;

  const parts: string[] = [];
  if (adminConfirmedCount > 0) {
    parts.push(`${adminConfirmedCount} admin-confirmed`);
  }
  if (selfReportedCount > 0) {
    parts.push(`${selfReportedCount} self-reported`);
  }

  if (parts.length === 0) return base;
  return `${base} · ${parts.join(", ")}`;
}

export function formatStudentComponentMetrics(params: {
  quizModulesPassed: number;
  modulesPassedTotal: number;
  workbookAnswered: number;
  workbookTotal: number;
  videosTracked: boolean;
  videoModulesWatched: number;
}): { quiz: string; workbook: string; video: string } {
  return {
    quiz: `${params.quizModulesPassed} of ${params.modulesPassedTotal} modules`,
    workbook: `${params.workbookAnswered} of ${params.workbookTotal} exercises`,
    video: params.videosTracked
      ? `${params.videoModulesWatched} of ${params.modulesPassedTotal} modules`
      : "not yet tracked",
  };
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

export function compareStudentsForRoster(
  a: CohortStudentMetrics,
  b: CohortStudentMetrics
): number {
  if (b.completionPercent !== a.completionPercent) {
    return b.completionPercent - a.completionPercent;
  }
  if (b.xp !== a.xp) {
    return b.xp - a.xp;
  }

  const nameA = (a.full_name ?? "").toLocaleLowerCase();
  const nameB = (b.full_name ?? "").toLocaleLowerCase();
  if (nameA !== nameB) {
    return nameA.localeCompare(nameB);
  }

  return a.id.localeCompare(b.id);
}

export { formatWorkbookActivityLabel };
