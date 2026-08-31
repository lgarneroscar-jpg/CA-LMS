import { daysSince, formatWorkbookActivityLabel } from "@/lib/workbook-activity";
import type { CohortStudentMetrics } from "@/lib/cohort-analytics";

export type AttentionReason =
  | "no_workbook"
  | "inactive"
  | "behind_pace"
  | "diagnostic_incomplete"
  | "low_quiz";

export function buildAttentionReasons(
  student: Pick<
    CohortStudentMetrics,
    | "workbookAnswered"
    | "last_active_date"
    | "isBehindPace"
    | "diagnostic_complete"
    | "quizModulesTaken"
    | "quizAverage"
  >,
  now = new Date()
): AttentionReason[] {
  const reasons: AttentionReason[] = [];

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

  return reasons;
}

export function attentionReasonLabel(reason: AttentionReason): string {
  switch (reason) {
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
  }
}

export function attentionReasonDetail(
  reason: AttentionReason,
  student: CohortStudentMetrics,
  now = new Date()
): string {
  switch (reason) {
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
