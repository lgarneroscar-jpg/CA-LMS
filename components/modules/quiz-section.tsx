"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, Lock } from "lucide-react";
import { submitQuiz } from "@/app/actions/module-progress";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  isQuizLocked,
  isQuizPassingScore,
  quizPassCorrectCount,
} from "@/lib/module-gates";
import { StationHeaderV2 } from "@/components/modules/v2/station-header";

export type QuizQuestionView = {
  id: string;
  question: string;
  options: { id: string; label: string }[];
};

export type IncompleteExerciseRef = {
  key: string;
  title: string;
};

type QuizSectionProps = {
  moduleId: string;
  pillarSlug: string;
  moduleSlug: string;
  questions: QuizQuestionView[];
  exercisesSubmitted: boolean;
  incompleteExercises?: IncompleteExerciseRef[];
  quizCompleted: boolean;
  quizScore: number | null;
  variant?: "default" | "lift";
  sectionId?: string;
  liftStationStatus?: "complete" | "current" | "upcoming";
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
  exercisesSubmitted,
  incompleteExercises = [],
  quizCompleted,
  quizScore,
  variant = "default",
  sectionId,
  liftStationStatus = "upcoming",
  onModuleComplete,
}: QuizSectionProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passed, setPassed] = useState(quizCompleted);
  const [score, setScore] = useState(quizScore);
  const [lastTotal, setLastTotal] = useState(questions.length);
  const [showRetake, setShowRetake] = useState(false);

  const locked = isQuizLocked(exercisesSubmitted);
  const isLift = variant === "lift";
  const passRequired = quizPassCorrectCount(questions.length);
  const attemptedBelowThreshold =
    !passed &&
    score != null &&
    !isQuizPassingScore(score, lastTotal) &&
    !showRetake;

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
        questions.map((q) => q.id)
      );
      setScore(result.score);
      setLastTotal(result.total);
      setPassed(result.passed);
      setShowRetake(false);
      setAnswers({});
      if (result.passed && result.moduleCompleted) {
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

  function startRetake() {
    setShowRetake(true);
    setAnswers({});
    setError(null);
  }

  const scoreLabel =
    score !== null ? `Score: ${score}/${lastTotal || questions.length}` : null;

  return (
    <section
      id={sectionId}
      className={cn(
        isLift ? "scroll-mt-40 space-y-8" : "space-y-6 rounded-xl border border-border p-6",
        !isLift && locked && "bg-muted/20"
      )}
    >
      {isLift ? (
        <StationHeaderV2
          stationId="check"
          title="Check your understanding"
          icon={<HelpCircle className="size-6" />}
          status={liftStationStatus}
        />
      ) : (
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <HelpCircle className="size-5 text-primary" />
            Module quiz
          </h2>
          {locked && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Lock className="size-4" />
              Finish exercises first
            </span>
          )}
          {!locked && scoreLabel ? (
            <span className="text-sm font-medium text-accent">{scoreLabel}</span>
          ) : null}
        </div>
      )}
      {isLift && scoreLabel && !locked ? (
        <div className="flex justify-end">
          <span className="rounded-full bg-lift-muted px-4 py-1.5 text-sm font-semibold text-lift">
            {scoreLabel}
          </span>
        </div>
      ) : null}
      {isLift && locked ? (
        <div className="flex justify-end">
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Lock className="size-4" />
            Finish exercises first
          </span>
        </div>
      ) : null}

      {locked ? (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            The quiz unlocks after every workbook exercise has an answer.
          </p>
          {incompleteExercises.length > 0 ? (
            <div className="space-y-2">
              <p className="font-medium text-foreground">Still to finish:</p>
              <ul className="list-inside list-disc space-y-1">
                {incompleteExercises.map((exercise) => (
                  <li key={exercise.key}>{exercise.title}</li>
                ))}
              </ul>
              <Link
                href="#station-do"
                className="inline-flex text-sm font-medium text-primary underline underline-offset-2"
                onClick={(event) => {
                  const target = document.getElementById("station-do");
                  if (target) {
                    event.preventDefault();
                    target.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
              >
                Go to exercises →
              </Link>
            </div>
          ) : (
            <Link
              href="#station-do"
              className="inline-flex text-sm font-medium text-primary underline underline-offset-2"
              onClick={(event) => {
                const target =
                  document.getElementById("station-do") ??
                  document.querySelector("[data-exercise-section]");
                if (target) {
                  event.preventDefault();
                  target.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
            >
              Go to exercises →
            </Link>
          )}
        </div>
      ) : passed ? (
        <p className="text-sm text-muted-foreground">
          Quiz passed. Your score has been recorded
          {score !== null
            ? ` (${score} of ${lastTotal || questions.length}).`
            : "."}
        </p>
      ) : attemptedBelowThreshold ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You scored {score} of {lastTotal}. You need {passRequired} of{" "}
            {lastTotal} to complete this module — take another try when you are
            ready.
          </p>
          <Button
            type="button"
            onClick={startRetake}
            className={cn(isLift && "lift-btn")}
          >
            Retake quiz
          </Button>
        </div>
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
                                "lift-card-interactive cursor-pointer rounded-2xl border p-5 text-base transition-all",
                                "peer-focus-visible:ring-2 peer-focus-visible:ring-lift/40",
                                selected
                                  ? "border-lift bg-lift-muted text-foreground shadow-md shadow-lift/15"
                                  : "border-border bg-card hover:border-lift/30 hover:bg-lift-muted/50"
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
