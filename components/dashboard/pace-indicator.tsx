import {
  formatPaceLabel,
  formatRelativeDays,
  getExpectedWeek,
  getPaceStatus,
  type PaceStatus,
} from "@/lib/pace";
import { cn } from "@/lib/utils";

type PaceIndicatorProps = {
  programStartedAt: string | null;
  progressWeek: number;
  lastLogin: string | null;
};

const STATUS_STYLES: Record<PaceStatus, string> = {
  not_started: "border-muted bg-muted/30 text-muted-foreground",
  on_pace: "border-emerald-200 bg-emerald-50 text-emerald-800",
  ahead: "border-sky-200 bg-sky-50 text-sky-800",
  behind: "border-amber-200 bg-amber-50 text-amber-900",
};

export function PaceIndicator({
  programStartedAt,
  progressWeek,
  lastLogin,
}: PaceIndicatorProps) {
  const status = getPaceStatus(programStartedAt, progressWeek);
  const expectedWeek = programStartedAt
    ? getExpectedWeek(programStartedAt)
    : null;
  const startedAgo = formatRelativeDays(programStartedAt);
  const loginAgo = formatRelativeDays(lastLogin);

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        STATUS_STYLES[status]
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{formatPaceLabel(status)}</p>
        {programStartedAt && expectedWeek != null ? (
          <p className="text-xs opacity-80">
            Week {progressWeek} of {expectedWeek} expected
          </p>
        ) : null}
      </div>
      <p className="mt-1 text-xs opacity-80">
        {programStartedAt
          ? `Started ${startedAgo ?? "recently"}`
          : "Click Go to begin your program clock"}
        {loginAgo ? ` · Last login ${loginAgo}` : ""}
      </p>
    </div>
  );
}
