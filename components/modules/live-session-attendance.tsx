"use client";

import { useState, useTransition } from "react";
import { markLiveSessionComplete } from "@/app/actions/module-progress";
import { Button } from "@/components/ui/button";

type LiveSessionAttendanceProps = {
  moduleId: string;
  pillarSlug: string;
  moduleSlug: string;
  streamUrl: string | null;
};

export function LiveSessionAttendance({
  moduleId,
  pillarSlug,
  moduleSlug,
  streamUrl,
}: LiveSessionAttendanceProps) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleMarkAttended() {
    startTransition(async () => {
      await markLiveSessionComplete(moduleId, pillarSlug, moduleSlug);
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="lift-card rounded-2xl border-lift/25 bg-lift-muted/40 p-6">
        <h2 className="text-lg font-semibold">Thanks for attending</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          +50 XP added to your total.
        </p>
      </div>
    );
  }

  return (
    <div className="lift-card space-y-5 rounded-2xl p-6 md:p-7">
      <div>
        <h2 className="text-lg font-semibold">Join the session</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Watch or attend the live session, then confirm attendance below.
          Attendance is recorded for your institution — it does not block
          certification.
        </p>
      </div>
      {streamUrl ? (
        <a
          href={streamUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="lift-btn inline-flex items-center"
        >
          Open live stream
        </a>
      ) : null}
      <Button
        onClick={handleMarkAttended}
        disabled={pending}
        className="lift-btn"
      >
        {pending ? "Saving..." : "Mark attendance (+50 XP)"}
      </Button>
    </div>
  );
}
