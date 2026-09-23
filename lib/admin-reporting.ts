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

export function buildAttentionReasons(
  student: Pick<
    CohortStudentMetrics,
    | "workbookAnswered"
    | "last_active_date"
    | "isBehindPace"
    | "diagnostic_complete"
    | "quizModulesTaken"
    | "quizAverage"
    | "quizBelowThresholdCount"
    | "invitePendingDays"
  >,
  now = new Date(),
  invitePendingThresholdDays = 7
): AttentionReason[] {
  const reasons: AttentionReason[] = [];

  if (
    student.invitePendingDays != null &&
    student.invitePendingDays >= invitePendingThresholdDays
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
  return `${averageQuizScore}% · ${quizScoreStudentCount} of ${totalStudents} students`;
}

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
