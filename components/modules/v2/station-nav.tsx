"use client";

import { useEffect, useState } from "react";
import { Video } from "lucide-react";
import type { StationId } from "@/components/modules/v2/module-hero";
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
};

export function StationNavV2({ activeStation, onNavigate }: StationNavV2Props) {
  return (
    <nav
      aria-label="Module stations"
      className="sticky top-14 z-30 -mx-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur md:-mx-6 md:px-6"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STATIONS.map((station) => {
          const isActive = activeStation === station.id;
          return (
            <button
              key={station.id}
              type="button"
              onClick={() => onNavigate(station.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lift/40 focus-visible:ring-offset-2",
                isActive
                  ? "bg-lift text-lift-foreground"
                  : "bg-muted text-muted-foreground hover:bg-lift-muted hover:text-lift"
              )}
            >
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
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      <Video className="size-4 shrink-0 text-lift" aria-hidden />
      <span>Video lesson — coming soon</span>
    </div>
  );
}
