"use client";

import { useMemo, useState } from "react";
import { PenLine, Lock } from "lucide-react";
import { submitExercises } from "@/app/actions/module-progress";
import { markExercisesReadyForQuiz } from "@/app/actions/exercise-answers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ExerciseCard } from "@/components/modules/exercise-card";
import type { ExerciseField } from "@/types/modules";
import { isStructuredExercise } from "@/types/modules";
import type { SavedExerciseAnswer } from "@/lib/exercise-answers";
import { isExercisesLocked } from "@/lib/module-gates";
import { cn } from "@/lib/utils";

function isLegacyExercise(
  field: ExerciseField
): field is Exclude<
  ExerciseField,
  { input_type: string; fields: unknown[] }
> {
  return !isStructuredExercise(field);
}

type ExerciseSectionProps = {
  moduleId: string;
  pillarSlug: string;
  moduleSlug: string;
  exercises: ExerciseField[];
  videoWatched: boolean;
  exercisesSubmitted: boolean;
  savedResponses: Record<string, string>;
  savedAnswers: Record<string, SavedExerciseAnswer>;
  defaultAnswerVisibility: boolean | null;
  hasAnySavedAnswers: boolean;
  variant?: "default" | "lift";
  sectionId?: string;
};

export function ExerciseSection({
  moduleId,
  pillarSlug,
  moduleSlug,
  exercises,
  videoWatched,
  exercisesSubmitted,
  savedResponses,
  savedAnswers: initialSavedAnswers,
  defaultAnswerVisibility,
  hasAnySavedAnswers: initialHasAnySavedAnswers,
  variant = "default",
  sectionId,
}: ExerciseSectionProps) {
  const [responses, setResponses] = useState<Record<string, string>>(
    savedResponses
  );
  const [savedAnswers, setSavedAnswers] = useState(initialSavedAnswers);
  const [hasAnySavedAnswers, setHasAnySavedAnswers] = useState(
    initialHasAnySavedAnswers
  );
  const [loading, setLoading] = useState(false);
  const [continueLoading, setContinueLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(exercisesSubmitted);

  const locked = isExercisesLocked(videoWatched);
  const structuredExercises = useMemo(
    () => exercises.filter(isStructuredExercise),
    [exercises]
  );
  const legacyExercises = useMemo(
    () => exercises.filter(isLegacyExercise),
    [exercises]
  );
  const structuredKeys = structuredExercises.map((e) => e.key);
  const allStructuredSaved =
    structuredKeys.length > 0 &&
    structuredKeys.every((key) => Boolean(savedAnswers[key]));

  function handleAnswerSaved(saved: SavedExerciseAnswer) {
    setSavedAnswers((prev) => ({ ...prev, [saved.exercise_key]: saved }));
    setHasAnySavedAnswers(true);
  }

  async function handleLegacySubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await submitExercises(
        moduleId,
        pillarSlug,
        moduleSlug,
        responses,
        legacyExercises
      );
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  async function handleContinueToQuiz() {
    setContinueLoading(true);
    setError(null);
    try {
      await markExercisesReadyForQuiz(
        moduleId,
        pillarSlug,
        moduleSlug,
        structuredKeys
      );
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to continue");
    } finally {
      setContinueLoading(false);
    }
  }

  const isLift = variant === "lift";

  return (
    <section
      id={sectionId}
      className={cn(
        isLift ? "scroll-mt-36 space-y-6" : "space-y-6 rounded-xl border border-border p-6",
        !isLift && locked && "bg-muted/20"
      )}
    >
      <div className="flex items-center justify-between">
        <h2
          className={cn(
            "flex items-center gap-2 font-semibold",
            isLift ? "text-2xl" : "text-lg"
          )}
        >
          <PenLine className={cn("size-5", isLift ? "text-lift" : "text-primary")} />
          {isLift ? "Do the work" : "Exercises"}
        </h2>
        {locked && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Lock className="size-4" />
            Complete the video first
          </span>
        )}
        {submitted && !locked && !isLift ? (
          <span className="text-sm font-medium text-accent">Ready for quiz</span>
        ) : null}
        {submitted && !locked && isLift ? (
          <span className="rounded-full bg-lift-muted px-3 py-1 text-sm font-medium text-lift">
            Ready for quiz
          </span>
        ) : null}
      </div>

      {locked ? (
        <p className="text-sm text-muted-foreground">
          Your workbook exercises will appear here once you&apos;ve watched 90% of
          the video lesson.
        </p>
      ) : (
        <div className="space-y-8">
          {structuredExercises.map((exercise, index) => (
            <ExerciseCard
              key={exercise.key}
              index={index}
              total={isLift ? structuredExercises.length : undefined}
              variant={variant}
              exercise={exercise}
              moduleId={moduleId}
              pillarSlug={pillarSlug}
              moduleSlug={moduleSlug}
              initialSaved={savedAnswers[exercise.key]}
              defaultAnswerVisibility={defaultAnswerVisibility}
              hasAnySavedAnswers={hasAnySavedAnswers}
              onSaved={handleAnswerSaved}
            />
          ))}

          {legacyExercises.length > 0 ? (
            <form onSubmit={handleLegacySubmit} className="space-y-8">
              {legacyExercises.map((field, index) => (
                <div key={field.key} className="space-y-3">
                  {field.type !== "checkbox" && (
                    <div className="space-y-1">
                      <Label className="text-base font-medium">
                        <span className="mr-2 text-muted-foreground">
                          {structuredExercises.length + index + 1}.
                        </span>
                        {field.label}
                      </Label>
                      {field.instructions && field.instructions !== field.label && (
                        <p className="text-sm text-muted-foreground">
                          {field.instructions}
                        </p>
                      )}
                    </div>
                  )}

                  {field.type === "text" &&
                    (field.multiline ? (
                      <Textarea
                        value={responses[field.key] ?? ""}
                        onChange={(e) =>
                          setResponses((r) => ({
                            ...r,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={field.placeholder}
                        rows={4}
                        disabled={submitted}
                      />
                    ) : (
                      <Input
                        value={responses[field.key] ?? ""}
                        onChange={(e) =>
                          setResponses((r) => ({
                            ...r,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={field.placeholder}
                        disabled={submitted}
                      />
                    ))}

                  {field.type === "choice" && (
                    <RadioGroup
                      value={responses[field.key] ?? ""}
                      onValueChange={(v) =>
                        setResponses((r) => ({ ...r, [field.key]: v }))
                      }
                      disabled={submitted}
                      className="gap-3"
                    >
                      {field.options.map((opt) => (
                        <div key={opt} className="flex items-center gap-2">
                          <RadioGroupItem value={opt} id={`${field.key}-${opt}`} />
                          <Label htmlFor={`${field.key}-${opt}`} className="font-normal">
                            {opt}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {field.type === "checkbox" && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 font-mono text-sm text-muted-foreground">
                          {structuredExercises.length + index + 1}.
                        </span>
                        <Checkbox
                          id={field.key}
                          checked={responses[field.key] === "true"}
                          onCheckedChange={(checked) =>
                            setResponses((r) => ({
                              ...r,
                              [field.key]: checked ? "true" : "",
                            }))
                          }
                          disabled={submitted}
                        />
                        <Label htmlFor={field.key} className="font-normal leading-snug">
                          {field.label}
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {!submitted && (
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving…" : "Submit exercises"}
                </Button>
              )}
            </form>
          ) : null}

          {structuredExercises.length > 0 && !submitted ? (
            <Button
              type="button"
              variant={isLift ? "default" : "secondary"}
              className={cn(isLift && "lift-btn")}
              disabled={!allStructuredSaved || continueLoading}
              onClick={handleContinueToQuiz}
            >
              {continueLoading ? "Continuing…" : "Continue to quiz"}
            </Button>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      )}
    </section>
  );
}
