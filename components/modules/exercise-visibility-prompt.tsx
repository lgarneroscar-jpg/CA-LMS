"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExerciseVisibilityPromptProps = {
  open: boolean;
  onChoose: (isPublic: boolean) => void;
  onCancel: () => void;
  saving?: boolean;
  /** Increments when a save is attempted while the prompt is already open. */
  nudge?: number;
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ExerciseVisibilityPrompt({
  open,
  onChoose,
  onCancel,
  saving,
  nudge = 0,
}: ExerciseVisibilityPromptProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    firstActionRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (open && nudge > 0) firstActionRef.current?.focus();
  }, [nudge, open]);

  // Only ever opened from a click, so this never renders on the server.
  if (!open) return null;

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (!saving) onCancel();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // Portalled to <body> so no transformed ancestor can trap the fixed overlay
  // off-screen, which made the prompt invisible while it blocked every save.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) firstActionRef.current?.focus();
      }}
    >
      <div
        // Re-keyed on each nudge so the shake animation replays.
        key={nudge}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="visibility-prompt-title"
        aria-describedby="visibility-prompt-description"
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-lg",
          nudge > 0 && "animate-[visibility-prompt-nudge_0.4s_ease-in-out]"
        )}
      >
        <h2 id="visibility-prompt-title" className="text-lg font-semibold">
          Choose who can see your workbook answers
        </h2>
        <p id="visibility-prompt-description" className="mt-2 text-sm text-muted-foreground">
          Answer this to save your exercise. Public answers can appear on your
          profile so mentors and peers can see your growth. Private answers stay
          visible only to you. You can change visibility per exercise anytime.
        </p>
        {nudge > 0 ? (
          <p role="status" className="mt-3 text-sm font-medium text-foreground">
            Pick an option to finish saving.
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            ref={firstActionRef}
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
          Cancel — don&apos;t save yet
        </Button>
      </div>
    </div>,
    document.body
  );
}
