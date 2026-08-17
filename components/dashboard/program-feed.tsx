import Link from "next/link";
import { CheckCircle2, Circle, Radio } from "lucide-react";
import type { LiveSessionStatus, WeekFeed } from "@/lib/program";
import { cn } from "@/lib/utils";

type ProgramFeedProps = {
  weeks: WeekFeed[];
  currentWeek: number;
  maxWeek: number;
};

const LIVE_STATUS_LABEL: Record<LiveSessionStatus, string> = {
  upcoming: "Upcoming",
  available: "Available now",
  past: "Past",
};

export function ProgramFeed({ weeks, currentWeek, maxWeek }: ProgramFeedProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between border-b border-lift/15 pb-4">
        <h2 className="lift-section-title text-xl font-bold tracking-tight md:text-2xl">
          Your timeline
        </h2>
        <span className="text-sm text-muted-foreground">
          Week {currentWeek} of {maxWeek}
        </span>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3 xl:gap-6">
        {weeks.map((week) => (
          <section
            key={week.weekNumber}
            className={cn(
              "flex min-w-0 w-full flex-col overflow-hidden rounded-2xl border p-4 md:p-5",
              week.isCurrentWeek
                ? "border-lift/30 bg-lift-muted/30 shadow-sm shadow-lift/5"
                : "border-border/80 bg-card"
            )}
          >
            <div className="mb-4">
              <p
                className={cn(
                  "text-xs font-bold uppercase tracking-widest",
                  week.isCurrentWeek ? "text-lift" : "text-muted-foreground"
                )}
              >
                {week.label}
              </p>
              <p className="mt-1 text-lg font-semibold">Week {week.weekNumber}</p>
            </div>

            {week.modules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No modules in this week.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {week.modules.map((mod) => {
                  if (mod.isLiveSession) {
                    const href = `/program/live/${mod.slug}`;
                    const liveStatus = mod.liveStatus ?? "upcoming";
                    return (
                      <li key={mod.id}>
                        <Link
                          href={href}
                          className={cn(
                            "lift-card-interactive flex w-full min-w-0 gap-3 rounded-2xl border-dashed p-3.5",
                            liveStatus === "available" &&
                              "border-lift/35 bg-lift-muted/40",
                            liveStatus === "upcoming" && "opacity-80"
                          )}
                        >
                          <div className="mt-0.5 shrink-0">
                            {mod.isComplete ? (
                              <CheckCircle2 className="size-5 text-lift" />
                            ) : (
                              <Radio
                                className={cn(
                                  "size-5",
                                  liveStatus === "available"
                                    ? "text-lift"
                                    : "text-muted-foreground"
                                )}
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
                                {mod.module_code}
                              </span>
                              <span className="lift-chip border-0 px-2 py-0.5 text-[10px]">
                                Live session
                              </span>
                              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                Week {mod.unlock_week}
                              </span>
                            </div>
                            <p className="lift-text-wrap font-medium leading-snug">{mod.title}</p>
                            <p
                              className={cn(
                                "text-xs font-medium",
                                liveStatus === "available"
                                  ? "text-lift"
                                  : "text-muted-foreground"
                              )}
                            >
                              {mod.isComplete
                                ? "Attendance recorded"
                                : LIVE_STATUS_LABEL[liveStatus]}
                              {!mod.isComplete ? " · Join →" : ""}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  }

                  const href = `/program/${mod.pillarSlug}/${mod.slug}`;

                  return (
                    <li key={mod.id}>
                      <Link
                        href={href}
                        className="lift-card-interactive flex w-full min-w-0 gap-3 rounded-2xl p-3.5"
                      >
                        <div className="mt-0.5 shrink-0">
                          {mod.isComplete ? (
                            <CheckCircle2 className="size-5 text-lift" />
                          ) : (
                            <Circle
                              className={cn(
                                "size-5",
                                week.isCurrentWeek
                                  ? "text-lift"
                                  : "text-muted-foreground"
                              )}
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <span className="inline-flex shrink-0 rounded-full bg-lift-muted px-2 py-0.5 font-mono text-[10px] font-bold text-lift">
                            {mod.module_code}
                          </span>
                          <p className="lift-text-wrap font-medium leading-snug">
                            {mod.title}
                          </p>
                          {mod.description ? (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {mod.description}
                            </p>
                          ) : null}
                          {mod.isComplete && mod.xpEarned > 0 ? (
                            <p className="mt-1 text-xs font-medium text-accent">
                              +{mod.xpEarned} XP
                            </p>
                          ) : null}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
