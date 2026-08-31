"use client";

import Link from "next/link";
import type { LiveSessionAttendanceRate } from "@/lib/cohort-analytics";

export function LiveSessionAttendanceSummary({
  institutionId,
  rates,
}: {
  institutionId: string;
  rates: LiveSessionAttendanceRate[];
}) {
  if (rates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No live sessions configured.</p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Self-reported attendance is shown separately and is not verified.
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rates.map((session) => (
          <div
            key={session.sessionId}
            className="rounded-lg border bg-background p-3 text-sm"
          >
            <p className="font-medium">
              {session.moduleCode} · {session.title}
            </p>
            <p className="mt-1 text-muted-foreground">{session.summaryLabel}</p>
            <Link
              href={`/admin/${institutionId}/attendance/${session.sessionId}`}
              className="mt-2 inline-block text-xs underline"
            >
              Manage attendance →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
