import { Clock } from "lucide-react";
import { getPillarLabel } from "@/lib/program";
import { cn } from "@/lib/utils";

export type StationId = "watch" | "read" | "do" | "check";

export type StationProgress = Record<
  StationId,
  "complete" | "current" | "upcoming"
>;

type ModuleHeroV2Props = {
  moduleCode: string;
  title: string;
  pillar: number;
  unlockWeek: number;
  estimatedMinutes: number;
  stationProgress: StationProgress;
};

const STATIONS: { id: StationId; label: string }[] = [
  { id: "watch", label: "Watch" },
  { id: "read", label: "Read" },
  { id: "do", label: "Do" },
  { id: "check", label: "Check" },
];

export function ModuleHeroV2({
  moduleCode,
  title,
  pillar,
  unlockWeek,
  estimatedMinutes,
  stationProgress,
}: ModuleHeroV2Props) {
  const completedCount = STATIONS.filter(
    (station) => stationProgress[station.id] === "complete"
  ).length;

  return (
    <header className="lift-framework space-y-6 rounded-3xl border border-lift/15 bg-card p-7 shadow-md shadow-lift/5 md:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-lift px-3.5 py-1.5 font-mono text-xs font-bold text-lift-foreground shadow-sm shadow-lift/20">
          {moduleCode}
        </span>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          {getPillarLabel(pillar)}
        </span>
        <span className="text-xs text-muted-foreground">
          Week {unlockWeek} · ~{estimatedMinutes} min
        </span>
      </div>

      <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-[2.5rem] md:leading-tight">
        {title}
      </h1>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            Module progress
          </span>
          <span>
            {completedCount} / {STATIONS.length} stations
          </span>
        </div>
        <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="lift-progress-fill absolute inset-y-0 left-0 rounded-full bg-lift"
            style={{ width: `${(completedCount / STATIONS.length) * 100}%` }}
          />
          <div className="absolute inset-0 grid grid-cols-4">
            {STATIONS.map((station, index) => (
              <div key={station.id} className="relative">
                {index > 0 ? (
                  <span className="absolute left-0 top-1/2 h-3 w-px -translate-y-1/2 bg-background/80" />
                ) : null}
                <span
                  className={cn(
                    "absolute right-0 top-1/2 size-2.5 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-background",
                    stationProgress[station.id] === "complete"
                      ? "bg-lift"
                      : "bg-muted-foreground/30"
                  )}
                  title={station.label}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {STATIONS.map((station) => (
            <span
              key={station.id}
              className={cn(
                stationProgress[station.id] === "complete" && "text-lift",
                stationProgress[station.id] === "current" && "text-foreground"
              )}
            >
              {station.label}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

export function buildStationProgress(params: {
  videoWatched: boolean;
  placeholderVideo: boolean;
  hasSavedExercise: boolean;
  exercisesSubmitted: boolean;
  quizCompleted: boolean;
}): StationProgress {
  const watchComplete = params.videoWatched || params.placeholderVideo;
  const readComplete = watchComplete;
  const doComplete = params.hasSavedExercise || params.exercisesSubmitted;
  const checkComplete = params.quizCompleted;

  const states = {
    watch: watchComplete ? "complete" : "current",
    read: !watchComplete
      ? "upcoming"
      : readComplete
        ? "complete"
        : "current",
    do: !readComplete
      ? "upcoming"
      : doComplete
        ? "complete"
        : "current",
    check: !doComplete
      ? "upcoming"
      : checkComplete
        ? "complete"
        : "current",
  } as StationProgress;

  return states;
}
