"use client";

import { useState } from "react";
import { PenLine, Lock } from "lucide-react";
import { submitExercises } from "@/app/actions/module-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ExerciseField } from "@/types/modules";
import { cn } from "@/lib/utils";

type ExerciseSectionProps = {
  moduleId: string;
  pillarSlug: string;
  moduleSlug: string;
  exercises: ExerciseField[];
  videoWatched: boolean;
  exercisesSubmitted: boolean;
  savedResponses: Record<string, string>;
};

export function ExerciseSection({
  moduleId,
  pillarSlug,
  moduleSlug,
  exercises,
  videoWatched,
  exercisesSubmitted,
  savedResponses,
}: ExerciseSectionProps) {
  const [responses, setResponses] = useState<Record<string, string>>(
    savedResponses
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(exercisesSubmitted);

  const locked = !videoWatched;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await submitExercises(
        moduleId,
        pillarSlug,
        moduleSlug,
        responses,
        exercises
      );
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={cn(
        "space-y-6 rounded-xl border border-border p-6",
        locked && "bg-muted/20"
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <PenLine className="size-5 text-primary" />
          Exercises
        </h2>
        {locked && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Lock className="size-4" />
            Complete the video first
          </span>
        )}
        {submitted && !locked && (
          <span className="text-sm font-medium text-accent">Submitted</span>
        )}
      </div>

      {locked ? (
        <p className="text-sm text-muted-foreground">
          Your workbook exercises will appear here once you&apos;ve watched 90% of
          the video lesson.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {exercises.map((field, index) => (
            <div key={field.key} className="space-y-3">
              {field.type !== "checkbox" && (
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    <span className="mr-2 text-muted-foreground">
                      {index + 1}.
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
                      <Label
                        htmlFor={`${field.key}-${opt}`}
                        className="font-normal"
                      >
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
                      {index + 1}.
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
                    <Label
                      htmlFor={field.key}
                      className="font-normal leading-snug"
                    >
                      {field.label}
                    </Label>
                  </div>
                  {field.instructions && field.instructions !== field.label && (
                    <p className="ml-8 text-sm text-muted-foreground">
                      {field.instructions}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {!submitted && (
            <Button type="submit" disabled={loading}>
              {loading ? "Saving responses…" : "Submit exercises"}
            </Button>
          )}
        </form>
      )}
    </section>
  );
}
