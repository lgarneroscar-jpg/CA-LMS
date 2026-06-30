"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { ModuleHeader } from "@/components/modules/module-header";
import { VideoSection } from "@/components/modules/video-section";
import { WorkbookContent } from "@/components/modules/workbook-content";
import { ExerciseSection } from "@/components/modules/exercise-section";
import { QuizSection, type QuizQuestionView } from "@/components/modules/quiz-section";
import { CompletionCelebration } from "@/components/modules/completion-celebration";
import { ProgramCompletionCelebration } from "@/components/program/program-completion-celebration";
import type { ExerciseField, WorkbookBlock, ModuleProgressState } from "@/types/modules";

type ModuleExperienceProps = {
  moduleId: string;
  pillarSlug: string;
  moduleSlug: string;
  title: string;
  moduleCode: string;
  pillar: number;
  estimatedMinutes: number;
  videoUrl: string;
  workbookBlocks: WorkbookBlock[];
  workbookOverview?: string;
  completionCheck?: string[];
  exercises: ExerciseField[];
  questions: QuizQuestionView[];
  correctAnswers: Record<string, string>;
  progress: ModuleProgressState;
  savedResponses: Record<string, string>;
  nextModuleHref: string | null;
  studentName: string;
};

export function ModuleExperience({
  moduleId,
  pillarSlug,
  moduleSlug,
  title,
  moduleCode,
  pillar,
  estimatedMinutes,
  videoUrl,
  workbookBlocks,
  workbookOverview,
  completionCheck,
  exercises,
  questions,
  correctAnswers,
  progress,
  savedResponses,
  nextModuleHref,
  studentName,
}: ModuleExperienceProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [showProgramComplete, setShowProgramComplete] = useState(false);
  const [certificateStudentId, setCertificateStudentId] = useState<string | null>(
    null
  );
  const [celebrationXp, setCelebrationXp] = useState(progress.xp_earned);
  const [celebrationScore, setCelebrationScore] = useState(
    progress.quiz_score ?? 0
  );

  const isComplete = progress.is_complete || showCelebration;

  function handleModuleComplete(
    xp: number,
    score: number,
    total: number,
    programJustCompleted?: boolean,
    certStudentId?: string
  ) {
    setCelebrationXp(xp);
    setCelebrationScore(score);
    setShowCelebration(true);
    if (programJustCompleted && certStudentId) {
      setShowProgramComplete(true);
      setCertificateStudentId(certStudentId);
    }
    void total;
  }

  const linkedInCaption = `I'm proud to share that I've completed the Corporate Academy program — building my pre-professional identity, communication skills, and career strategy. #CorporateAcademy #CareerReady`;

  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-16">
      {showProgramComplete && certificateStudentId ? (
        <ProgramCompletionCelebration
          studentName={studentName}
          certificateUrl={`/certificate/${certificateStudentId}`}
          linkedInCaption={linkedInCaption}
        />
      ) : null}
      <ModuleHeader
        title={title}
        moduleCode={moduleCode}
        pillar={pillar}
        estimatedMinutes={estimatedMinutes}
        isComplete={isComplete}
      />

      {isComplete ? (
        <CompletionCelebration
          xpEarned={celebrationXp || progress.xp_earned}
          quizScore={celebrationScore}
          quizTotal={questions.length}
          nextModuleHref={nextModuleHref}
        />
      ) : (
        <>
          <VideoSection
            videoUrl={videoUrl}
            moduleId={moduleId}
            pillarSlug={pillarSlug}
            moduleSlug={moduleSlug}
            videoWatched={progress.video_watched}
          />

          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <BookOpen className="size-5 text-primary" />
              Workbook
            </h2>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <WorkbookContent
                overview={workbookOverview}
                blocks={workbookBlocks}
                completionCheck={completionCheck}
              />
            </div>
          </section>

          <ExerciseSection
            moduleId={moduleId}
            pillarSlug={pillarSlug}
            moduleSlug={moduleSlug}
            exercises={exercises}
            videoWatched={progress.video_watched}
            exercisesSubmitted={progress.exercises_submitted}
            savedResponses={savedResponses}
          />

          <QuizSection
            moduleId={moduleId}
            pillarSlug={pillarSlug}
            moduleSlug={moduleSlug}
            questions={questions}
            correctAnswers={correctAnswers}
            exercisesSubmitted={progress.exercises_submitted}
            quizCompleted={progress.quiz_completed}
            quizScore={progress.quiz_score}
            onModuleComplete={handleModuleComplete}
          />
        </>
      )}
    </div>
  );
}
