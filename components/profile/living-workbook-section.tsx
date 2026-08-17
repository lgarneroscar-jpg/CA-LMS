import Link from "next/link";
import { BookOpen } from "lucide-react";
import { AnswerDisplay } from "@/components/profile/answer-display";
import { AnswerVisibilityControl } from "@/components/profile/answer-visibility-control";
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
    <section className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-lift-muted text-lift">
          <BookOpen className="size-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight">{sectionTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{sectionDescription}</p>
        </div>
      </div>

      {!hasAnswers ? (
        <div className="lift-card rounded-2xl p-6">
          <h3 className="font-semibold">{emptyTitle}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
          {showEmptyProgramLink ? (
            <Link
              href="/program"
              className="mt-3 inline-block text-sm font-medium text-lift underline-offset-4 hover:underline"
            >
              Go to curriculum
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="space-y-10">
          {pillars.map((pillar) => (
            <section key={pillar.pillar} className="space-y-4">
              <div className="border-b border-lift/15 pb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-lift">
                  Pillar {pillar.pillar}
                </p>
                <h3 className="mt-1 text-lg font-bold tracking-tight">
                  {pillar.pillarLabel}
                </h3>
              </div>

              {pillar.modules.map((module) => (
                <div key={module.moduleId} className="space-y-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="shrink-0 rounded-full bg-lift-muted px-2.5 py-0.5 font-mono text-[10px] font-bold text-lift">
                      {module.moduleCode}
                    </span>
                    <p className="min-w-0 break-words text-sm font-semibold leading-snug">
                      {module.moduleTitle}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {module.exercises.map((exercise) => (
                      <article
                        key={exercise.answerId}
                        className="lift-card min-w-0 space-y-4 rounded-2xl p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="shrink-0 rounded-full bg-lift-muted px-2 py-0.5 font-mono text-[10px] font-bold text-lift">
                                {exercise.moduleCode}
                              </span>
                              <span className="min-w-0 break-words text-xs text-muted-foreground">
                                {exercise.moduleTitle}
                              </span>
                            </div>
                            <h4 className="break-words font-semibold leading-snug">
                              {exercise.title}
                            </h4>
                          </div>
                          {showVisibilityControls ? (
                            <AnswerVisibilityControl
                              answerId={exercise.answerId}
                              moduleId={exercise.moduleId}
                              pillarSlug={exercise.pillarSlug}
                              moduleSlug={exercise.moduleSlug}
                              initialIsPublic={exercise.isPublic}
                            />
                          ) : (
                            <span className="shrink-0 rounded-full bg-lift px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-lift-foreground">
                              Public
                            </span>
                          )}
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
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
