import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import type { WeekFeed } from "@/lib/program";
import { cn } from "@/lib/utils";

type ProgramFeedProps = {
  weeks: WeekFeed[];
  currentWeek: number;
  maxWeek: number;
};

export function ProgramFeed({ weeks, currentWeek, maxWeek }: ProgramFeedProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between border-b border-border pb-4">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Your timeline
        </h2>
        <span className="text-sm text-muted-foreground">
          Week {currentWeek} of {maxWeek}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3 md:gap-6">
        {weeks.map((week) => (
          <section
            key={week.weekNumber}
            className={cn(
              "rounded-2xl border p-4 md:p-5",
              week.isCurrentWeek
                ? "border-accent/50 bg-accent/5 shadow-sm ring-1 ring-accent/20"
                : "border-border bg-card/50"
            )}
          >
            <div className="mb-4">
              <p
                className={cn(
                  "text-xs font-bold uppercase tracking-widest",
                  week.isCurrentWeek ? "text-accent" : "text-muted-foreground"
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
              <ul className="space-y-2">
                {week.modules.map((mod) => {
                  const href = `/program/${mod.pillarSlug}/${mod.slug}`;

                  return (
                    <li key={mod.id}>
                      <Link
                        href={href}
                        className={cn(
                          "flex gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-border hover:bg-background",
                          week.isCurrentWeek && "bg-background/80"
                        )}
                      >
                        <div className="mt-0.5 shrink-0">
                          {mod.isComplete ? (
                            <CheckCircle2 className="size-5 text-accent" />
                          ) : (
                            <Circle
                              className={cn(
                                "size-5",
                                week.isCurrentWeek
                                  ? "text-accent"
                                  : "text-muted-foreground"
                              )}
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-snug">
                            <span className="font-mono text-xs text-muted-foreground">
                              {mod.module_code}
                            </span>
                            {" · "}
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
