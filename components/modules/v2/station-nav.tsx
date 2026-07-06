"use client";

import { useEffect, useState } from "react";
import { Video } from "lucide-react";
import type { StationId, StationProgress } from "@/components/modules/v2/module-hero";
import { cn } from "@/lib/utils";

const STATIONS: { id: StationId; label: string }[] = [
  { id: "watch", label: "Watch" },
  { id: "read", label: "Read" },
  { id: "do", label: "Do" },
  { id: "check", label: "Check" },
];

type StationNavV2Props = {
  activeStation: StationId;
  onNavigate: (station: StationId) => void;
  stationProgress: StationProgress;
};

export function StationNavV2({
  activeStation,
  onNavigate,
  stationProgress,
}: StationNavV2Props) {
  return (
    <nav
      aria-label="Module stations"
      className="sticky top-14 z-30 -mx-2 border-b border-lift/10 bg-background/95 px-2 py-3 backdrop-blur md:-mx-4 md:px-4"
    >
      <div className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STATIONS.map((station) => {
          const isActive = activeStation === station.id;
          const isComplete = stationProgress[station.id] === "complete";
          return (
            <button
              key={station.id}
              type="button"
              onClick={() => onNavigate(station.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lift/40 focus-visible:ring-offset-2",
                isActive
                  ? "bg-lift text-lift-foreground shadow-md shadow-lift/25"
                  : "bg-muted text-muted-foreground hover:bg-lift-muted hover:text-lift hover:shadow-sm"
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  isComplete ? "bg-lift-foreground" : "bg-current opacity-40"
                )}
                aria-hidden
              />
              {station.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function useStationScrollSpy(sectionIds: StationId[]) {
  const [activeStation, setActiveStation] = useState<StationId>(sectionIds[0]);

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(`station-${id}`))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target.id.replace("station-", "") as StationId | undefined;
        if (top) setActiveStation(top);
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sectionIds]);

  function scrollToStation(station: StationId) {
    document.getElementById(`station-${station}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setActiveStation(station);
  }

  return { activeStation, scrollToStation };
}

export function VideoStripV2() {
  return (
    <div className="lift-card flex items-center gap-3 rounded-2xl border border-dashed border-lift/20 bg-lift-muted/30 px-5 py-4 text-base text-muted-foreground">
      <Video className="size-5 shrink-0 text-lift" aria-hidden />
      <span>Video lesson — coming soon</span>
    </div>
  );
}
