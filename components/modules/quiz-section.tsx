"use client";

import { useState } from "react";
import { HelpCircle, Lock } from "lucide-react";
import { submitQuiz } from "@/app/actions/module-progress";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { isQuizLocked } from "@/lib/module-gates";

export type QuizQuestionView = {
  id: string;
  question: string;
  options: { id: string; label: string }[];
};

type QuizSectionProps = {
  moduleId: string;
  pillarSlug: string;
  moduleSlug: string;
  questions: QuizQuestionView[];
  correctAnswers: Record<string, string>;
  exercisesSubmitted: boolean;
  quizCompleted: boolean;
  quizScore: number | null;
  variant?: "default" | "lift";
  sectionId?: string;
  onModuleComplete: (
    xp: number,
    score: number,
    total: number,
    programJustCompleted?: boolean,
    certificateStudentId?: string
  ) => void;
};

export function QuizSection({
  moduleId,
  pillarSlug,
  moduleSlug,
  questions,
  correctAnswers,
  exercisesSubmitted,
  quizCompleted,
  quizScore,
  variant = "default",
  sectionId,
  onModuleComplete,
}: QuizSectionProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(quizCompleted);
  const [score, setScore] = useState(quizScore);

  const locked = isQuizLocked(exercisesSubmitted);
  const isLift = variant === "lift";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await submitQuiz(
        moduleId,
        pillarSlug,
        moduleSlug,
        answers,
        questions.map((q) => q.id),
        correctAnswers
      );
      setCompleted(true);
      setScore(result.score);
      if (result.moduleCompleted) {
        onModuleComplete(
          result.xpEarned,
          result.score,
          result.total,
          result.programJustCompleted,
          result.certificateStudentId
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz");
    } finally {
      setLoading(false);
    }
  }

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
          <HelpCircle className={cn("size-5", isLift ? "text-lift" : "text-primary")} />
          {isLift ? "Check your understanding" : "Module quiz"}
        </h2>
        {locked && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Lock className="size-4" />
            Submit exercises first
          </span>
        )}
        {completed && score !== null && (
          <span
            className={cn(
              "text-sm font-medium",
              isLift ? "text-lift" : "text-accent"
            )}
          >
            Score: {score}/{questions.length}
          </span>
        )}
      </div>

      {locked ? (
        <p className="text-sm text-muted-foreground">
          Five questions unlock after you submit your exercise responses.
        </p>
      ) : completed ? (
        <p className="text-sm text-muted-foreground">
          Quiz complete. Your score has been recorded.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {questions.map((q, index) => (
            <div key={q.id} className="space-y-3">
              <p className="font-medium">
                <span className="text-muted-foreground">{index + 1}. </span>
                {q.question}
              </p>
              <RadioGroup
                value={answers[q.id] ?? ""}
                onValueChange={(v) =>
                  setAnswers((a) => ({ ...a, [q.id]: v }))
                }
                className={cn("gap-3", isLift && "grid gap-3 sm:grid-cols-2")}
              >
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt.id;
                  return (
                    <div key={opt.id}>
                      <RadioGroupItem
                        value={opt.id}
                        id={`${q.id}-${opt.id}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`${q.id}-${opt.id}`}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 font-normal leading-snug",
                          isLift
                            ? cn(
                                "rounded-2xl border p-4 transition-colors",
                                "peer-focus-visible:ring-2 peer-focus-visible:ring-lift/40",
                                selected
                                  ? "border-lift bg-lift-muted text-foreground"
                                  : "border-border bg-card hover:border-lift/30 hover:bg-lift-muted/40"
                              )
                            : ""
                        )}
                      >
                        {isLift ? (
                          <span
                            className={cn(
                              "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                              selected
                                ? "border-lift bg-lift text-lift-foreground"
                                : "border-border"
                            )}
                          >
                            {selected ? (
                              <span className="size-1.5 rounded-full bg-current" />
                            ) : null}
                          </span>
                        ) : null}
                        {opt.label}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          ))}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className={cn(isLift && "lift-btn")}>
            {loading ? "Submitting…" : "Submit quiz"}
          </Button>
        </form>
      )}
    </section>
  );
}
