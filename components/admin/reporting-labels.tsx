import {
  attentionReasonDetail,
  formatWorkbookActivityLabel,
} from "@/lib/admin-reporting";
import type { CohortStudentMetrics } from "@/lib/cohort-analytics";

export function WorkbookActivityLabel({
  student,
}: {
  student: Pick<
    CohortStudentMetrics,
    "workbookAnswered" | "workbookTotal" | "lastWorkbookActivity"
  >;
}) {
  return (
    <span className="text-muted-foreground">
      {formatWorkbookActivityLabel(student)}
    </span>
  );
}

export function AttentionReasonChips({
  student,
}: {
  student: CohortStudentMetrics;
}) {
  if (student.attentionReasons.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap justify-end gap-1">
      {student.attentionReasons.map((reason) => (
        <span
          key={reason}
          className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-900"
        >
          {attentionReasonDetail(reason, student)}
        </span>
      ))}
    </div>
  );
}
