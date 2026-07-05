"use client";

import { useState, useTransition } from "react";
import { setAnswerVisibility } from "@/app/actions/exercise-answers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AnswerVisibilityControlProps = {
  answerId: string;
  moduleId: string;
  pillarSlug: string;
  moduleSlug: string;
  initialIsPublic: boolean;
};

export function AnswerVisibilityControl({
  answerId,
  moduleId,
  pillarSlug,
  moduleSlug,
  initialIsPublic,
}: AnswerVisibilityControlProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    const next = !isPublic;
    setError(null);
    startTransition(async () => {
      try {
        await setAnswerVisibility({
          answerId,
          moduleId,
          pillarSlug,
          moduleSlug,
          isPublic: next,
        });
        setIsPublic(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update visibility");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={isPublic ? "default" : "secondary"}>
        {isPublic ? "Public" : "Private"}
      </Badge>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={handleToggle}
        className={cn("h-7 text-xs")}
      >
        {pending ? "Saving…" : isPublic ? "Make private" : "Make public"}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
