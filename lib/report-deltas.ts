import type { CohortAnalytics } from "@/lib/cohort-analytics";
import type { ReportSnapshotEnvelope } from "@/lib/reports";

export type MetricDelta = {
  key: string;
  label: string;
  previous: number | null;
  current: number | null;
  delta: number | null;
  unit: "percent" | "count" | "points";
  /** When false, UI must not show a numeric delta. */
  comparable: boolean;
  note?: string;
};

export type ReportDeltas = {
  completionDefinitionCurrent: string;
  completionDefinitionPrevious: string | null;
  completionComparable: boolean;
  completionNote: string | null;
  metrics: MetricDelta[];
};

function pctDelta(
  key: string,
  label: string,
  previous: number | null | undefined,
  current: number | null | undefined,
  comparable: boolean,
  note?: string
): MetricDelta {
  const prev = previous ?? null;
  const curr = current ?? null;
  return {
    key,
    label,
    previous: prev,
    current: curr,
    delta: comparable && prev != null && curr != null ? curr - prev : null,
    unit: "percent",
    comparable,
    note,
  };
}

function countDelta(
  key: string,
  label: string,
  previous: number | null | undefined,
  current: number | null | undefined,
  comparable = true
): MetricDelta {
  const prev = previous ?? null;
  const curr = current ?? null;
  return {
    key,
    label,
    previous: prev,
    current: curr,
    delta: comparable && prev != null && curr != null ? curr - prev : null,
    unit: "count",
    comparable,
  };
}

/**
 * Diff current snapshot against previous.
 * Completion-related metrics are refused when completionDefinition differs.
 */
export function computeReportDeltas(
  current: ReportSnapshotEnvelope,
  previous: ReportSnapshotEnvelope | null
): ReportDeltas | null {
  if (!previous) return null;

  const completionComparable =
    current.completionDefinition === previous.completionDefinition &&
    previous.completionDefinition !== "unknown-legacy";

  const completionNote = completionComparable
    ? null
    : `definition changed — not comparable (${previous.completionDefinition} → ${current.completionDefinition})`;

  const a = previous.metrics;
  const b = current.metrics;

  const metrics: MetricDelta[] = [
    pctDelta(
      "overallCompletionRate",
      "Modules passed (avg)",
      a.overallCompletionRate,
      b.overallCompletionRate,
      completionComparable,
      completionNote ?? undefined
    ),
    pctDelta(
      "averageWorkbookCompletionPercent",
      "Avg workbook completion",
      a.averageWorkbookCompletionPercent,
      b.averageWorkbookCompletionPercent,
      true
    ),
    pctDelta(
      "averageQuizScore",
      "Avg quiz score",
      a.averageQuizScore,
      b.averageQuizScore,
      true
    ),
    countDelta(
      "quizScoreStudentCount",
      "Students with quiz scores",
      a.quizScoreStudentCount,
      b.quizScoreStudentCount
    ),
    pctDelta(
      "weeklyEngagementScore",
      "Weekly engagement",
      a.weeklyEngagementScore,
      b.weeklyEngagementScore,
      true
    ),
    countDelta(
      "studentsWithZeroWorkbookActivity",
      "No workbook activity",
      a.studentsWithZeroWorkbookActivity,
      b.studentsWithZeroWorkbookActivity
    ),
    countDelta(
      "needsAttention",
      "Students needing attention",
      a.needsAttentionStudents?.length ?? 0,
      b.needsAttentionStudents?.length ?? 0
    ),
    ...attendanceDeltas(a, b),
  ];

  return {
    completionDefinitionCurrent: current.completionDefinition,
    completionDefinitionPrevious: previous.completionDefinition,
    completionComparable,
    completionNote,
    metrics,
  };
}

function attendanceDeltas(
  previous: CohortAnalytics,
  current: CohortAnalytics
): MetricDelta[] {
  const prevBySession = new Map(
    (previous.liveSessionAttendanceRates ?? []).map((s) => [s.sessionId, s])
  );
  const deltas: MetricDelta[] = [];

  for (const session of current.liveSessionAttendanceRates ?? []) {
    const prev = prevBySession.get(session.sessionId);
    deltas.push(
      pctDelta(
        `attendance:${session.sessionId}`,
        `Attendance ${session.moduleCode}`,
        prev?.rate ?? null,
        session.rate,
        true
      )
    );
  }

  return deltas;
}

export function formatDeltaValue(
  delta: MetricDelta
): string {
  if (!delta.comparable) {
    return "not comparable";
  }
  if (delta.current == null && delta.previous == null) {
    return "—";
  }
  if (delta.delta == null) {
    return "—";
  }
  const sign = delta.delta > 0 ? "+" : "";
  if (delta.unit === "percent") {
    return `${sign}${delta.delta} pp`;
  }
  return `${sign}${delta.delta}`;
}
