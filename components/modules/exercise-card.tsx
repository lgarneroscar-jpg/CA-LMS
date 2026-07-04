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

type ExerciseCardProps = {
  index: number;
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

  return (
    <>
      <ExerciseVisibilityPrompt
        open={showPrompt}
        saving={loading}
        onCancel={() => setShowPrompt(false)}
        onChoose={handleVisibilityChoice}
      />

      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-base font-medium">
              <span className="mr-2 text-muted-foreground">{index + 1}.</span>
              {exercise.title}
            </Label>
            <Badge variant="outline" className="font-mono text-[10px]">
              {exercise.input_type}
            </Badge>
          </div>
          {exercise.instructions ? (
            <p className="text-sm text-muted-foreground">{exercise.instructions}</p>
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

        <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked === true)}
            />
            <span>Show on my profile when public</span>
          </label>

          <div className="flex flex-col items-start gap-1 sm:items-end">
            <Button type="button" onClick={handleSaveClick} disabled={loading}>
              {loading ? "Saving…" : "Save exercise"}
            </Button>
            {savedFlash ? (
              <span className="text-xs font-medium text-accent">Saved</span>
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
