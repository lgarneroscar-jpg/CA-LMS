import {
  formatPaceHeadline,
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
  not_started: "border-border/80 bg-card text-muted-foreground",
  on_pace: "border-lift/20 bg-lift-muted/40 text-foreground",
  ahead: "border-lift/25 bg-lift-muted/50 text-foreground",
  behind: "border-border bg-muted/40 text-foreground",
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
        "lift-card rounded-2xl border px-5 py-4",
        STATUS_STYLES[status]
      )}
    >
      <p className="text-sm font-semibold leading-snug">
        {formatPaceHeadline(status, progressWeek, expectedWeek)}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {programStartedAt
          ? `Started ${startedAgo ?? "recently"}`
          : "Click Go to begin your program clock"}
        {loginAgo ? ` · Last login ${loginAgo}` : ""}
      </p>
    </div>
  );
}
