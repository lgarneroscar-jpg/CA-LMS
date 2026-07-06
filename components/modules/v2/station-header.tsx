import type { ReactNode } from "react";
import { Check } from "lucide-react";
import type { StationId } from "@/components/modules/v2/module-hero";
import { cn } from "@/lib/utils";

type StationStatus = "complete" | "current" | "upcoming";

type StationHeaderV2Props = {
  stationId: StationId;
  title: string;
  icon: ReactNode;
  status: StationStatus;
};

const STATION_LABELS: Record<StationId, string> = {
  watch: "Watch",
  read: "Read",
  do: "Do",
  check: "Check",
};

export function StationHeaderV2({
  stationId,
  title,
  icon,
  status,
}: StationHeaderV2Props) {
  return (
    <div className="lift-station-header space-y-2 border-b border-lift/15 pb-5">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            status === "complete"
              ? "border-lift bg-lift text-lift-foreground shadow-sm shadow-lift/20"
              : status === "current"
                ? "border-lift bg-lift-muted text-lift"
                : "border-border bg-muted text-muted-foreground"
          )}
          aria-hidden
        >
          {status === "complete" ? (
            <Check className="size-4" />
          ) : (
            <span className="size-2.5 rounded-full bg-current opacity-80" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-lift">
            {STATION_LABELS[stationId]}
          </p>
          <h2 className="lift-section-title flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            <span className="text-lift">{icon}</span>
            {title}
          </h2>
        </div>
      </div>
    </div>
  );
}
