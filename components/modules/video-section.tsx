"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Play, CheckCircle2 } from "lucide-react";
import { markVideoWatched } from "@/app/actions/module-progress";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

type VideoSectionProps = {
  videoUrl: string;
  moduleId: string;
  pillarSlug: string;
  moduleSlug: string;
  videoWatched: boolean;
  disabled?: boolean;
};

export function VideoSection({
  videoUrl,
  moduleId,
  pillarSlug,
  moduleSlug,
  videoWatched,
  disabled,
}: VideoSectionProps) {
  const [watched, setWatched] = useState(videoWatched);
  const [progress, setProgress] = useState(videoWatched ? 100 : 0);
  const [saving, setSaving] = useState(false);
  const markedRef = useRef(false);

  const handleTimeUpdate = useCallback(
    async (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget;
      if (!video.duration || video.duration <= 0) return;

      const played = video.currentTime / video.duration;
      const pct = Math.round(played * 100);
      setProgress(pct);

      if (played >= 0.9 && !markedRef.current && !watched) {
        markedRef.current = true;
        setSaving(true);
        try {
          await markVideoWatched(moduleId, pillarSlug, moduleSlug);
          setWatched(true);
          setProgress(100);
        } finally {
          setSaving(false);
        }
      }
    },
    [moduleId, pillarSlug, moduleSlug, watched]
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Play className="size-5 text-primary" />
          Video lesson
        </h2>
        {watched && (
          <span className="flex items-center gap-1 text-sm font-medium text-accent">
            <CheckCircle2 className="size-4" />
            Watched
          </span>
        )}
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border bg-black shadow-lg",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <div className="relative aspect-video w-full">
          <ReactPlayer
            src={videoUrl}
            width="100%"
            height="100%"
            controls
            onTimeUpdate={handleTimeUpdate}
            className="absolute inset-0 [&_video]:h-full [&_video]:w-full"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Watch progress</span>
          <span>{saving ? "Saving…" : `${progress}%`}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground">
          Exercises unlock after you watch at least 90% of this video.
        </p>
      </div>
    </section>
  );
}
