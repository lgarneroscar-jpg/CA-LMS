"use client";

import { useState, useTransition } from "react";
import { setAnswerVisibility } from "@/app/actions/exercise-answers";
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
      <span
        className={cn(
          "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
          isPublic
            ? "bg-lift text-lift-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isPublic ? "Public" : "Private"}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={handleToggle}
        className="h-8 rounded-lg text-xs"
      >
        {pending ? "Saving…" : isPublic ? "Make private" : "Make public"}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
