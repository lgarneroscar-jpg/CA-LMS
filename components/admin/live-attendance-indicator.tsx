import type { LiveSessionRef } from "@/lib/cohort-analytics";
import { liveAttendanceLabel, liveSessionExportHeader } from "@/lib/cohort-analytics";

type LiveAttendanceIndicatorProps = {
  sessions: LiveSessionRef[];
  attendedModuleIds: string[];
};

export function LiveAttendanceIndicator({
  sessions,
  attendedModuleIds,
}: LiveAttendanceIndicatorProps) {
  const attended = new Set(attendedModuleIds);
  const attendedCount = sessions.filter((session) => attended.has(session.id)).length;
  const summary = sessions
    .map(
      (session) =>
        `${session.module_code}: ${liveAttendanceLabel(attended.has(session.id))}`
    )
    .join(" · ");

  return (
    <div className="flex items-center gap-2" title={summary || undefined}>
      <span className="whitespace-nowrap tabular-nums">
        {attendedCount} of {sessions.length}
      </span>
      {sessions.length > 0 ? (
        <span className="flex gap-0.5" aria-hidden="true">
          {sessions.map((session) => {
            const didAttend = attended.has(session.id);
            return (
              <span
                key={session.id}
                title={`${liveSessionExportHeader(session)}: ${liveAttendanceLabel(didAttend)}`}
                className={
                  didAttend
                    ? "inline-block size-1.5 rounded-full bg-foreground"
                    : "inline-block size-1.5 rounded-full bg-muted-foreground/30"
                }
              />
            );
          })}
        </span>
      ) : null}
    </div>
  );
}
