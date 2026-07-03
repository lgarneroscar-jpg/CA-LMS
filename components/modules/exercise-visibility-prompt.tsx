"use client";

import { Button } from "@/components/ui/button";

type ExerciseVisibilityPromptProps = {
  open: boolean;
  onChoose: (isPublic: boolean) => void;
  onCancel: () => void;
  saving?: boolean;
};

export function ExerciseVisibilityPrompt({
  open,
  onChoose,
  onCancel,
  saving,
}: ExerciseVisibilityPromptProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="visibility-prompt-title"
        className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-lg"
      >
        <h3 id="visibility-prompt-title" className="text-lg font-semibold">
          Workbook answer visibility
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose your default for workbook answers. Public answers can appear on
          your profile so mentors and peers can see your growth. Private answers
          stay visible only to you. You can change visibility per exercise anytime.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="flex-1"
            disabled={saving}
            onClick={() => onChoose(true)}
          >
            Public by default
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            disabled={saving}
            onClick={() => onChoose(false)}
          >
            Private by default
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="mt-2 w-full"
          disabled={saving}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
