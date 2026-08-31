"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CohortAnalytics } from "@/lib/cohort-analytics";
import {
  ATTENTION_REASONS,
  attentionReasonLabel,
  countAttentionReasons,
  pluralize,
  studentMatchesReasonFilter,
  type AttentionReason,
} from "@/lib/admin-reporting";
import { moduleCompletionExplainer } from "@/lib/module-gates";
import {
  AttentionReasonChips,
  WorkbookActivityLabel,
} from "@/components/admin/reporting-labels";

const COLLAPSED_ATTENTION_LIMIT = 5;

export function ModuleCompletionBarList({
  institutionId,
  modules,
  studentNames,
}: {
  institutionId: string;
  modules: CohortAnalytics["moduleCompletionRates"];
  studentNames: Record<string, string>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = modules.find((mod) => mod.moduleId === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {modules.map((mod) => {
          const isActive = mod.moduleId === selectedId;
          return (
            <li key={mod.moduleId}>
              <button
                type="button"
                onClick={() =>
                  setSelectedId(isActive ? null : mod.moduleId)
                }
                className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                  isActive
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      <span className="font-mono text-xs text-muted-foreground">
                        {mod.moduleCode}
                      </span>
                      <span className="mx-1.5 text-muted-foreground">·</span>
                      {mod.title}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 sm:w-56">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${mod.completionRate}%` }}
                      />
                    </div>
                    <span className="w-28 text-right text-sm tabular-nums text-muted-foreground">
                      {mod.completionRate}% ({mod.completedCount} of{" "}
                      {mod.cohortSize})
                    </span>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {selected ? (
        <div className="rounded-lg border bg-muted/20 p-4">
          <p className="font-medium">
            {selected.moduleCode} · {selected.title}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <StudentIdList
              institutionId={institutionId}
              title={`Completed (${selected.completedStudentIds.length})`}
              studentIds={selected.completedStudentIds}
              studentNames={studentNames}
              emptyLabel="None yet"
            />
            <StudentIdList
              institutionId={institutionId}
              title={`Not completed (${selected.incompleteStudentIds.length})`}
              studentIds={selected.incompleteStudentIds}
              studentNames={studentNames}
              emptyLabel="All complete"
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Click a module to see who completed it.
        </p>
      )}
    </div>
  );
}

function StudentIdList({
  institutionId,
  title,
  studentIds,
  studentNames,
  emptyLabel,
}: {
  institutionId: string;
  title: string;
  studentIds: string[];
  studentNames: Record<string, string>;
  emptyLabel: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {title}
      </p>
      {studentIds.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto text-sm">
          {studentIds.map((id) => (
            <li key={id}>
              <Link
                href={`/admin/${institutionId}/students/${id}`}
                className="hover:underline"
              >
                {studentNames[id] ?? "Unnamed"}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AttentionReasonFilters({
  reasonCounts,
  activeReason,
  onReasonChange,
}: {
  reasonCounts: Record<AttentionReason, number>;
  activeReason: AttentionReason | null;
  onReasonChange: (reason: AttentionReason | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onReasonChange(null)}
        className={`rounded-full border px-3 py-1 text-xs ${
          activeReason === null
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-background text-muted-foreground hover:bg-muted"
        }`}
      >
        All students
      </button>
      {ATTENTION_REASONS.map((reason) => {
        const count = reasonCounts[reason];
        if (count === 0) return null;
        return (
          <button
            key={reason}
            type="button"
            onClick={() =>
              onReasonChange(activeReason === reason ? null : reason)
            }
            className={`rounded-full border px-3 py-1 text-xs ${
              activeReason === reason
                ? "border-amber-500 bg-amber-100 text-amber-950"
                : "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
            }`}
          >
            {attentionReasonLabel(reason)} ({count})
          </button>
        );
      })}
    </div>
  );
}

export function CohortRankingsList({
  institutionId,
  topStudents,
  needsAttentionStudents,
  activeReason,
}: {
  institutionId: string;
  topStudents: CohortAnalytics["topStudents"];
  needsAttentionStudents: CohortAnalytics["needsAttentionStudents"];
  activeReason: AttentionReason | null;
}) {
  const [showAllAttention, setShowAllAttention] = useState(false);

  const filteredAttention = useMemo(() => {
    if (!activeReason) return needsAttentionStudents;
    return needsAttentionStudents.filter((student) =>
      studentMatchesReasonFilter(student, activeReason)
    );
  }, [needsAttentionStudents, activeReason]);

  const visibleAttention = showAllAttention
    ? filteredAttention
    : filteredAttention.slice(0, COLLAPSED_ATTENTION_LIMIT);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Top 10 by XP</h3>
        <ul className="divide-y divide-border text-sm">
          {topStudents.map((s, i) => (
            <li key={s.id} className="flex items-center justify-between py-2">
              <Link
                href={`/admin/${institutionId}/students/${s.id}`}
                className="hover:underline"
              >
                {i + 1}. {s.full_name ?? "Unnamed"}
              </Link>
              <span className="text-muted-foreground">{s.xp} XP</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-amber-700">
          Needs attention ({filteredAttention.length})
        </h3>
        <ul className="divide-y divide-border text-sm">
          {visibleAttention.length === 0 ? (
            <li className="py-2 text-muted-foreground">
              No students match this filter.
            </li>
          ) : (
            visibleAttention.map((s) => (
              <li key={s.id} className="py-2">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/admin/${institutionId}/students/${s.id}`}
                    className="hover:underline"
                  >
                    {s.full_name ?? "Unnamed"}
                  </Link>
                  <span className="shrink-0 text-muted-foreground">
                    {s.modulesPassedCount}/{s.modulesPassedTotal} modules ·{" "}
                    {s.xp} XP
                  </span>
                </div>
                <AttentionReasonChips student={s} />
              </li>
            ))
          )}
        </ul>
        {filteredAttention.length > COLLAPSED_ATTENTION_LIMIT ? (
          <button
            type="button"
            className="mt-2 text-sm underline"
            onClick={() => setShowAllAttention((value) => !value)}
          >
            {showAllAttention
              ? "Show fewer"
              : `Show all ${filteredAttention.length}`}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function AdminDashboardReporting({
  institutionId,
  analytics,
  studentNames,
}: {
  institutionId: string;
  analytics: CohortAnalytics;
  studentNames: Record<string, string>;
}) {
  const [activeReason, setActiveReason] = useState<AttentionReason | null>(
    null
  );

  const reasonCounts = useMemo(
    () => countAttentionReasons(analytics.allStudents),
    [analytics.allStudents]
  );

  const filteredStudents = useMemo(
    () =>
      analytics.allStudents.filter((student) =>
        studentMatchesReasonFilter(student, activeReason)
      ),
    [analytics.allStudents, activeReason]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <AttentionReasonFilters
          reasonCounts={reasonCounts}
          activeReason={activeReason}
          onReasonChange={setActiveReason}
        />
        <p className="text-xs text-muted-foreground">
          Click a reason to filter the roster below. {moduleCompletionExplainer()}
        </p>
      </div>

      <CohortRankingsList
        institutionId={institutionId}
        topStudents={analytics.topStudents}
        needsAttentionStudents={analytics.needsAttentionStudents}
        activeReason={activeReason}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Modules passed</th>
              <th className="py-2 pr-4">Quiz</th>
              <th className="py-2 pr-4">Workbook</th>
              <th className="py-2 pr-4">Live sessions</th>
              <th className="py-2 pr-4">XP</th>
              <th className="py-2">Flag</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s) => (
              <tr key={s.id} className="border-b border-border/60">
                <td className="py-2 pr-4">
                  <Link
                    href={`/admin/${institutionId}/students/${s.id}`}
                    className={
                      s.hasFlag
                        ? "font-medium text-amber-700 underline"
                        : "hover:underline"
                    }
                  >
                    {s.full_name ?? "Unnamed"}
                  </Link>
                </td>
                <td className="py-2 pr-4">
                  {s.modulesPassedCount} of {s.modulesPassedTotal}
                </td>
                <td className="py-2 pr-4">
                  {s.quizModulesPassed} of {s.modulesPassedTotal}
                </td>
                <td className="py-2 pr-4">
                  <WorkbookActivityLabel student={s} />
                </td>
                <td className="py-2 pr-4 text-muted-foreground">
                  {s.liveAttendance.summaryLabel}
                </td>
                <td className="py-2 pr-4">{s.xp}</td>
                <td className="py-2">{s.hasFlag ? "Flagged" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DiagnosticSummary({
  institutionId,
  diagnostic,
  totalStudents,
}: {
  institutionId: string;
  diagnostic: CohortAnalytics["diagnostic"];
  totalStudents: number;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm">
        <span className="font-medium">{diagnostic.completedCount}</span> of{" "}
        {totalStudents} students completed the Week-1 diagnostic.
      </p>
      {diagnostic.incompleteStudents.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-amber-800">
            Not yet completed ({diagnostic.incompleteStudents.length})
          </p>
          <ul className="divide-y divide-border rounded-lg border text-sm">
            {diagnostic.incompleteStudents.map((student) => (
              <li
                key={student.id}
                className="flex items-center justify-between px-3 py-2"
              >
                <Link
                  href={`/admin/${institutionId}/students/${student.id}`}
                  className="hover:underline"
                >
                  {student.full_name ?? "Unnamed"}
                </Link>
                <span className="text-muted-foreground">
                  enrolled {student.daysSinceEnrollment}{" "}
                  {pluralize(student.daysSinceEnrollment, "day")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Every enrolled student has completed the diagnostic.
        </p>
      )}
    </div>
  );
}
