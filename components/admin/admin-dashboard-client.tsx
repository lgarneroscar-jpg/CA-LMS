"use client";

import { useState } from "react";
import Link from "next/link";
import type { CohortAnalytics } from "@/lib/cohort-analytics";

type AdminDashboardClientProps = {
  institutionId: string;
  analytics: CohortAnalytics;
};

export function ModuleCompletionDonut({
  institutionId,
  modules,
  studentNames,
}: {
  institutionId: string;
  modules: CohortAnalytics["moduleCompletionRates"];
  studentNames: Record<string, string>;
}) {
  const [selected, setSelected] = useState<(typeof modules)[number] | null>(
    null
  );

  const colors = [
    "#1B2A4A",
    "#2563eb",
    "#059669",
    "#d97706",
    "#7c3aed",
    "#db2777",
    "#0891b2",
    "#65a30d",
  ];

  let offset = 0;
  const segments = modules.map((mod, i) => {
    const dash = mod.completionRate;
    const segment = {
      ...mod,
      dash,
      offset,
      color: colors[i % colors.length],
    };
    offset += dash;
    return segment;
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="relative mx-auto h-48 w-48">
        <svg viewBox="0 0 42 42" className="h-full w-full">
          {segments.map((seg) => (
            <circle
              key={seg.moduleId}
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={seg.color}
              strokeWidth="6"
              strokeDasharray={`${seg.dash} ${100 - seg.dash}`}
              strokeDashoffset={25 - seg.offset}
              className="cursor-pointer transition-opacity hover:opacity-80"
              onClick={() => setSelected(seg)}
            />
          ))}
        </svg>
      </div>
      <div>
        {selected ? (
          <div className="space-y-3">
            <p className="font-medium">
              {selected.moduleCode} · {selected.title} ({selected.completionRate}
              %)
            </p>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Completed ({selected.completedStudentIds.length})
              </p>
              {selected.completedStudentIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">None yet</p>
              ) : (
                <ul className="mt-1 max-h-32 space-y-0.5 overflow-y-auto text-sm">
                  {selected.completedStudentIds.map((id) => (
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
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Not completed ({selected.incompleteStudentIds.length})
              </p>
              {selected.incompleteStudentIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">All complete</p>
              ) : (
                <ul className="mt-1 max-h-32 space-y-0.5 overflow-y-auto text-sm">
                  {selected.incompleteStudentIds.map((id) => (
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
            <button
              type="button"
              className="text-sm underline"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        ) : (
          <ul className="space-y-1 text-sm">
            {modules.map((mod, i) => (
              <li key={mod.moduleId}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 text-left hover:underline"
                  onClick={() => setSelected(mod)}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: colors[i % colors.length] }}
                  />
                  {mod.moduleCode} — {mod.completionRate}%
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function CohortRankingsList({
  institutionId,
  topStudents,
  bottomStudents,
}: {
  institutionId: string;
  topStudents: CohortAnalytics["topStudents"];
  bottomStudents: CohortAnalytics["bottomStudents"];
}) {
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
          Behind pace (bottom 5)
        </h3>
        <ul className="divide-y divide-border text-sm">
          {bottomStudents.length === 0 ? (
            <li className="py-2 text-muted-foreground">No students flagged by pace.</li>
          ) : (
            bottomStudents.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2">
                <Link
                  href={`/admin/${institutionId}/students/${s.id}`}
                  className="hover:underline"
                >
                  {s.full_name ?? "Unnamed"}
                </Link>
                <span className="text-muted-foreground">
                  {s.completionPercent}% · {s.xp} XP
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
