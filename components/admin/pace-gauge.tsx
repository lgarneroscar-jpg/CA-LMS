"use client";

type PaceGaugeProps = {
  targetWeek: number;
  pacePercent: number;
};

export function PaceGauge({ targetWeek, pacePercent }: PaceGaugeProps) {
  const clamped = Math.min(100, Math.max(0, pacePercent));

  return (
    <div className="space-y-4">
      <div className="relative mx-auto h-32 w-32">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${clamped}, 100`}
            className="text-accent"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold">{clamped}%</span>
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Target: Week {targetWeek} complete. Cohort average: {clamped}% of Week{" "}
        {targetWeek} content done.
      </p>
    </div>
  );
}
