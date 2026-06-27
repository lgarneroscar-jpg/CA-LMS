"use client";

import { useState, useTransition } from "react";
import { markLiveSessionComplete } from "@/app/actions/module-progress";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <Card className="border-accent/30 bg-accent/5">
        <CardHeader>
          <CardTitle>Thanks for attending!</CardTitle>
          <CardDescription>+50 XP added to your total.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join the session</CardTitle>
        <CardDescription>
          Watch or attend the live session, then confirm attendance below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {streamUrl ? (
          <a
            href={streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-accent underline"
          >
            Open live stream
          </a>
        ) : null}
        <Button onClick={handleMarkAttended} disabled={pending}>
          {pending ? "Saving..." : "Mark attendance (+50 XP)"}
        </Button>
      </CardContent>
    </Card>
  );
}
