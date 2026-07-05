import Link from "next/link";
import { BookOpen } from "lucide-react";
import { AnswerDisplay } from "@/components/profile/answer-display";
import { AnswerVisibilityControl } from "@/components/profile/answer-visibility-control";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatAnswerTimestamp } from "@/lib/exercise-answers";
import type { WorkbookPortfolioPillar } from "@/lib/profile-workbook";

type LivingWorkbookSectionProps = {
  pillars: WorkbookPortfolioPillar[];
  showVisibilityControls?: boolean;
  sectionTitle?: string;
  sectionDescription?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  showEmptyProgramLink?: boolean;
};

export function LivingWorkbookSection({
  pillars,
  showVisibilityControls = false,
  sectionTitle = "My Living Workbook",
  sectionDescription = "Saved exercise responses from your program journey.",
  emptyTitle = "No workbook answers yet",
  emptyDescription = "Complete exercises in the program to build your living workbook.",
  showEmptyProgramLink = true,
}: LivingWorkbookSectionProps) {
  const hasAnswers = pillars.length > 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="size-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">{sectionTitle}</h2>
          <p className="text-sm text-muted-foreground">{sectionDescription}</p>
        </div>
      </div>

      {!hasAnswers ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{emptyTitle}</CardTitle>
            <CardDescription>{emptyDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {showEmptyProgramLink ? (
              <Link
                href="/program"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Go to program
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pillars.map((pillar) => (
            <div key={pillar.pillar} className="space-y-4">
              <h3 className="text-base font-semibold">{pillar.pillarLabel}</h3>
              {pillar.modules.map((module) => (
                <Card key={module.moduleId}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      <span className="font-mono text-xs text-muted-foreground">
                        {module.moduleCode}
                      </span>{" "}
                      · {module.moduleTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {module.exercises.map((exercise) => (
                      <article
                        key={exercise.answerId}
                        className="space-y-3 border-t border-border pt-4 first:border-t-0 first:pt-0"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">{exercise.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {exercise.moduleCode} · {exercise.moduleTitle}
                            </p>
                          </div>
                          {showVisibilityControls ? (
                            <AnswerVisibilityControl
                              answerId={exercise.answerId}
                              moduleId={exercise.moduleId}
                              pillarSlug={exercise.pillarSlug}
                              moduleSlug={exercise.moduleSlug}
                              initialIsPublic={exercise.isPublic}
                            />
                          ) : null}
                        </div>

                        <AnswerDisplay
                          inputType={exercise.inputType}
                          exerciseKey={exercise.exerciseKey}
                          fields={exercise.fields}
                          answer={exercise.answer}
                        />

                        <p className="text-xs text-muted-foreground">
                          Last updated {formatAnswerTimestamp(exercise.updatedAt)}
                        </p>
                      </article>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
