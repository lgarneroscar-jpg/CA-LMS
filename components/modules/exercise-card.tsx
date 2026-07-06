"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StructuredExerciseInput } from "@/components/modules/structured-exercise-input";
import { ExerciseVisibilityPrompt } from "@/components/modules/exercise-visibility-prompt";
import { saveExerciseAnswer } from "@/app/actions/exercise-answers";
import type { ExerciseField } from "@/types/modules";
import { isStructuredExercise } from "@/types/modules";
import {
  emptyAnswerData,
  formatAnswerTimestamp,
  isAnswerEmpty,
  parseAnswerData,
  type ExerciseAnswerData,
  type SavedExerciseAnswer,
} from "@/lib/exercise-answers";
import { cn } from "@/lib/utils";

type ExerciseCardProps = {
  index: number;
  total?: number;
  variant?: "default" | "lift";
  exercise: Extract<ExerciseField, { input_type: string; fields: unknown[] }>;
  moduleId: string;
  pillarSlug: string;
  moduleSlug: string;
  initialSaved?: SavedExerciseAnswer;
  defaultAnswerVisibility: boolean | null;
  hasAnySavedAnswers: boolean;
  onSaved: (saved: SavedExerciseAnswer) => void;
};

export function ExerciseCard({
  index,
  total,
  variant = "default",
  exercise,
  moduleId,
  pillarSlug,
  moduleSlug,
  initialSaved,
  defaultAnswerVisibility,
  hasAnySavedAnswers,
  onSaved,
}: ExerciseCardProps) {
  if (!isStructuredExercise(exercise)) return null;

  const [draft, setDraft] = useState<ExerciseAnswerData>(
    initialSaved?.answer ?? emptyAnswerData()
  );
  const [isPublic, setIsPublic] = useState(
    initialSaved?.is_public ?? defaultAnswerVisibility ?? false
  );
  const [updatedAt, setUpdatedAt] = useState<string | null>(
    initialSaved?.updated_at ?? null
  );
  const [savedFlash, setSavedFlash] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  const needsFirstSavePrompt =
    defaultAnswerVisibility === null && !hasAnySavedAnswers && !initialSaved;

  async function persist(setDefaultVisibility?: boolean | null) {
    setLoading(true);
    setError(null);
    try {
      const result = await saveExerciseAnswer({
        moduleId,
        pillarSlug,
        moduleSlug,
        exerciseKey: exercise.key,
        answer: draft,
        isPublic,
        setDefaultVisibility: setDefaultVisibility ?? undefined,
      });
      setUpdatedAt(result.updatedAt);
      setIsPublic(result.isPublic);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2500);
      onSaved({
        exercise_key: exercise.key,
        answer: draft,
        is_public: result.isPublic,
        updated_at: result.updatedAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
      setShowPrompt(false);
    }
  }

  function handleSaveClick() {
    if (isAnswerEmpty(exercise.input_type, draft, exercise.fields, exercise.key)) {
      setError("Add at least one response before saving");
      return;
    }
    if (needsFirstSavePrompt) {
      setShowPrompt(true);
      return;
    }
    void persist();
  }

  function handleVisibilityChoice(isPublicDefault: boolean) {
    setIsPublic(isPublicDefault);
    void persist(isPublicDefault);
  }

  const isLift = variant === "lift";
  const isSaved = Boolean(updatedAt);

  return (
    <>
      <ExerciseVisibilityPrompt
        open={showPrompt}
        saving={loading}
        onCancel={() => setShowPrompt(false)}
        onChoose={handleVisibilityChoice}
      />

      <div
        className={cn(
          "space-y-5 border bg-card",
          isLift
            ? "lift-card-interactive rounded-3xl border-border/80 p-7 shadow-md shadow-lift/5 [&_input]:lift-input [&_textarea]:lift-input [&_textarea]:min-h-[8rem] [&_textarea]:rounded-xl [&_textarea]:text-base [&_input]:rounded-xl [&_input]:text-base [&_label]:text-base"
            : "rounded-lg border-border p-4"
        )}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {isLift ? (
              <Badge className="lift-chip border-0 bg-lift-muted font-normal text-lift">
                Exercise {index + 1}
                {total ? ` of ${total}` : ""}
              </Badge>
            ) : (
              <Label className="text-base font-medium">
                <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                {exercise.title}
              </Label>
            )}
            {!isLift ? (
              <Badge variant="outline" className="font-mono text-[10px]">
                {exercise.input_type}
              </Badge>
            ) : null}
            {isLift && isSaved ? (
              <Badge className="border-lift/20 bg-lift-muted text-lift">Saved ✓</Badge>
            ) : null}
          </div>
          {isLift ? (
            <h3 className="text-xl font-bold text-foreground">{exercise.title}</h3>
          ) : null}
          {exercise.instructions ? (
            <p className={cn(isLift ? "lift-body text-muted-foreground" : "text-sm text-muted-foreground")}>
              {exercise.instructions}
            </p>
          ) : null}
        </div>

        <StructuredExerciseInput
          inputType={exercise.input_type}
          exerciseKey={exercise.key}
          fields={exercise.fields}
          options={exercise.options}
          value={draft}
          onChange={setDraft}
        />

        <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <label className={cn("flex items-center gap-2", isLift ? "lift-body" : "text-sm")}>
            <Checkbox
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked === true)}
            />
            <span>Show on my profile when public</span>
          </label>

          <div className="flex flex-col items-start gap-1 sm:items-end">
            <Button
              type="button"
              onClick={handleSaveClick}
              disabled={loading}
              className={cn(isLift && "lift-btn px-6")}
            >
              {loading ? "Saving…" : "Save exercise"}
            </Button>
            {savedFlash ? (
              <span
                className={cn(
                  "text-xs font-medium",
                  isLift ? "text-lift" : "text-accent"
                )}
              >
                Saved
              </span>
            ) : null}
            {updatedAt ? (
              <span className="text-xs text-muted-foreground">
                Last updated {formatAnswerTimestamp(updatedAt)}
              </span>
            ) : null}
            {error ? (
              <span className="text-xs text-destructive">{error}</span>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

export function hydrateSavedAnswer(
  raw: unknown
): SavedExerciseAnswer | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Record<string, unknown>;
  if (typeof row.exercise_key !== "string") return undefined;
  return {
    exercise_key: row.exercise_key,
    answer: parseAnswerData(row.answer),
    is_public: Boolean(row.is_public),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}
