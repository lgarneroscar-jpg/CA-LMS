import type { CapriOutcomesPayload } from "@/lib/capri-outcomes";
import type { ReportDeltas } from "@/lib/report-deltas";
import { formatDeltaValue } from "@/lib/report-deltas";
import type { ReportSnapshotEnvelope } from "@/lib/reports";
import {
  formatAverageQuizScoreLabel,
  attentionReasonDetail,
} from "@/lib/admin-reporting";
import { moduleCompletionExplainer } from "@/lib/module-gates";

type InstitutionReportArtifactProps = {
  institutionName: string;
  periodStart: string;
  periodEnd: string;
  envelope: ReportSnapshotEnvelope;
  deltas: ReportDeltas | null;
  capri: CapriOutcomesPayload;
};

function MetricOrDash({
  value,
  suffix = "",
  empty = "— · no data yet",
}: {
  value: number | null | undefined;
  suffix?: string;
  empty?: string;
}) {
  if (value == null) {
    return <span className="text-muted-foreground">{empty}</span>;
  }
  return (
    <span>
      {value}
      {suffix}
    </span>
  );
}

export function InstitutionReportArtifact({
  institutionName,
  periodStart,
  periodEnd,
  envelope,
  deltas,
  capri,
}: InstitutionReportArtifactProps) {
  const m = envelope.metrics;

  return (
    <article className="mx-auto max-w-3xl space-y-8 bg-white p-8 text-foreground print:max-w-none print:p-0">
      <header className="space-y-2 border-b pb-6">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          Corporate Academy · Institutional report
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{institutionName}</h1>
        <p className="text-muted-foreground">
          Period {periodStart} → {periodEnd} · {m.cohortWeekLabel} ·{" "}
          {envelope.cohortSize} students
        </p>
        <p className="text-xs text-muted-foreground">
          Generated {new Date(envelope.generatedAt).toLocaleString()} ·{" "}
          {envelope.generatedBy} · completion definition{" "}
          <code>{envelope.completionDefinition}</code> · snapshot v
          {envelope.snapshotVersion}
        </p>
      </header>

      {m.cohortPhase === "pre_start" ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Cohort starts in {m.daysUntilStart} day
          {m.daysUntilStart === 1 ? "" : "s"} — no activity expected yet. This
          report does not flag pace or attention.
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Participation &amp; completion</h2>
        <p className="text-xs text-muted-foreground">{moduleCompletionExplainer()}</p>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <dt className="text-xs text-muted-foreground">Modules passed (avg)</dt>
            <dd className="text-2xl font-semibold">
              <MetricOrDash value={m.overallCompletionRate} suffix="%" />
            </dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-xs text-muted-foreground">Weekly engagement</dt>
            <dd className="text-2xl font-semibold">
              <MetricOrDash value={m.weeklyEngagementScore} suffix="%" />
            </dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-xs text-muted-foreground">Diagnostic complete</dt>
            <dd className="text-2xl font-semibold">
              {m.diagnostic.completedCount} of {envelope.cohortSize}
            </dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-xs text-muted-foreground">Avg XP</dt>
            <dd className="text-2xl font-semibold">
              <MetricOrDash value={m.averageXp} />
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Workbook depth</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <dt className="text-xs text-muted-foreground">Avg workbook completion</dt>
            <dd className="text-2xl font-semibold">
              <MetricOrDash
                value={m.averageWorkbookCompletionPercent}
                suffix="%"
              />
            </dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-xs text-muted-foreground">No workbook activity</dt>
            <dd className="text-2xl font-semibold">
              {m.studentsWithZeroWorkbookActivity} students
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Quiz performance</h2>
        <p className="text-2xl font-semibold">
          {formatAverageQuizScoreLabel(
            m.averageQuizScore,
            m.quizScoreStudentCount,
            envelope.cohortSize
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          Average among students who have taken at least one quiz. Pass threshold
          is 75% (3 of 4 on current quizzes).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Live session attendance</h2>
        <p className="text-xs text-muted-foreground">
          Self-reported attendance is never presented as verified.
        </p>
        <ul className="space-y-2 text-sm">
          {(m.liveSessionAttendanceRates ?? []).map((session) => (
            <li key={session.sessionId} className="rounded-lg border p-3">
              <p className="font-medium">
                {session.moduleCode} · {session.title}
              </p>
              <p className="text-muted-foreground">{session.summaryLabel}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Since last report</h2>
        {!deltas ? (
          <p className="text-sm text-muted-foreground">
            No prior snapshot for this institution — nothing to compare yet.
          </p>
        ) : (
          <div className="space-y-3">
            {!deltas.completionComparable ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                Completion definition changed — not comparable (
                <code>{deltas.completionDefinitionPrevious}</code> →{" "}
                <code>{deltas.completionDefinitionCurrent}</code>).
              </p>
            ) : null}
            <ul className="divide-y divide-border rounded-lg border text-sm">
              {deltas.metrics.map((metric) => (
                <li
                  key={metric.key}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <span>{metric.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {metric.comparable
                      ? formatDeltaValue(metric)
                      : "definition changed — not comparable"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Students needing attention</h2>
        {m.needsAttentionStudents.length === 0 ? (
          <p className="text-sm text-muted-foreground">None flagged this period.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {m.needsAttentionStudents.map((student) => (
              <li key={student.id} className="rounded-lg border p-3">
                <p className="font-medium">{student.full_name ?? "Unnamed"}</p>
                <p className="text-muted-foreground">
                  Modules passed {student.modulesPassedCount} of{" "}
                  {student.modulesPassedTotal} · Workbook{" "}
                  {student.workbookAnswered} of {student.workbookTotal}
                </p>
                <p className="mt-1 text-xs text-amber-800">
                  {student.attentionReasons
                    .map((reason) => attentionReasonDetail(reason, student))
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Outcomes (CAPRI)</h2>
        {!capri ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Not yet available
          </p>
        ) : (
          <div className="space-y-2 text-sm">
            {capri.summary ? <p>{capri.summary}</p> : null}
            {capri.metrics?.map((metric) => (
              <p key={metric.label}>
                <span className="text-muted-foreground">{metric.label}: </span>
                {metric.value}
              </p>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t pt-4 text-xs text-muted-foreground print:pt-6">
        Counts only — workbook and diagnostic answer text are never included.
        Attendance is reported separately from module completion.
      </footer>
    </article>
  );
}
