"use client";

import { useState } from "react";
import { HelpCircle, Lock } from "lucide-react";
import { submitQuiz } from "@/app/actions/module-progress";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

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
  onModuleComplete,
}: QuizSectionProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(quizCompleted);
  const [score, setScore] = useState(quizScore);

  const locked = !exercisesSubmitted;

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
      className={cn(
        "space-y-6 rounded-xl border border-border p-6",
        locked && "bg-muted/20"
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <HelpCircle className="size-5 text-primary" />
          Module quiz
        </h2>
        {locked && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Lock className="size-4" />
            Submit exercises first
          </span>
        )}
        {completed && score !== null && (
          <span className="text-sm font-medium text-accent">
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
                className="gap-3"
              >
                {q.options.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <RadioGroupItem value={opt.id} id={`${q.id}-${opt.id}`} />
                    <Label
                      htmlFor={`${q.id}-${opt.id}`}
                      className="font-normal"
                    >
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading}>
            {loading ? "Submitting…" : "Submit quiz"}
          </Button>
        </form>
      )}
    </section>
  );
}
