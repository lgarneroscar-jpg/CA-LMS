"use client";

import { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { CompletionCelebration } from "@/components/modules/completion-celebration";
import { ProgramCompletionCelebration } from "@/components/program/program-completion-celebration";
import { ExerciseSection } from "@/components/modules/exercise-section";
import { QuizSection, type QuizQuestionView } from "@/components/modules/quiz-section";
import { VideoSection } from "@/components/modules/video-section";
import {
  ModuleHeroV2,
  buildStationProgress,
} from "@/components/modules/v2/module-hero";
import {
  StationNavV2,
  VideoStripV2,
  useStationScrollSpy,
} from "@/components/modules/v2/station-nav";
import { WorkbookBlocksV2 } from "@/components/modules/v2/workbook-blocks";
import { SHOW_PLACEHOLDER_VIDEO_STRIP } from "@/lib/experience-lift";
import type { ExerciseField, WorkbookBlock, ModuleProgressState } from "@/types/modules";
import type { SavedExerciseAnswer } from "@/lib/exercise-answers";

type ModuleExperienceV2Props = {
  moduleId: string;
  pillarSlug: string;
  moduleSlug: string;
  title: string;
  moduleCode: string;
  pillar: number;
  unlockWeek: number;
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
  savedAnswers: Record<string, SavedExerciseAnswer>;
  defaultAnswerVisibility: boolean | null;
  hasAnySavedAnswers: boolean;
  nextModuleHref: string | null;
  studentName: string;
};

const STATION_IDS = ["watch", "read", "do", "check"] as const;

export function ModuleExperienceV2(props: ModuleExperienceV2Props) {
  const {
    moduleId,
    pillarSlug,
    moduleSlug,
    videoUrl,
    workbookBlocks,
    workbookOverview,
    completionCheck,
    exercises,
    questions,
    correctAnswers,
    progress,
    savedResponses,
    savedAnswers,
    defaultAnswerVisibility,
    hasAnySavedAnswers,
    nextModuleHref,
    studentName,
    title,
    moduleCode,
    pillar,
    unlockWeek,
    estimatedMinutes,
  } = props;

  const [showCelebration, setShowCelebration] = useState(false);
  const [showProgramComplete, setShowProgramComplete] = useState(false);
  const [certificateStudentId, setCertificateStudentId] = useState<string | null>(
    null
  );
  const [celebrationXp, setCelebrationXp] = useState(progress.xp_earned);
  const [celebrationScore, setCelebrationScore] = useState(
    progress.quiz_score ?? 0
  );

  const { activeStation, scrollToStation } = useStationScrollSpy([...STATION_IDS]);

  const hasSavedExercise = useMemo(
    () => Object.keys(savedAnswers).length > 0,
    [savedAnswers]
  );

  const stationProgress = buildStationProgress({
    videoWatched: progress.video_watched,
    placeholderVideo: SHOW_PLACEHOLDER_VIDEO_STRIP,
    hasSavedExercise,
    exercisesSubmitted: progress.exercises_submitted,
    quizCompleted: progress.quiz_completed,
  });

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
    <div className="experience-lift mx-auto max-w-3xl space-y-8 pb-16">
      {showProgramComplete && certificateStudentId ? (
        <ProgramCompletionCelebration
          studentName={studentName}
          certificateUrl={`/certificate/${certificateStudentId}`}
          linkedInCaption={linkedInCaption}
        />
      ) : null}

      <ModuleHeroV2
        moduleCode={moduleCode}
        title={title}
        pillar={pillar}
        unlockWeek={unlockWeek}
        estimatedMinutes={estimatedMinutes}
        stationProgress={stationProgress}
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
          <StationNavV2
            activeStation={activeStation}
            onNavigate={scrollToStation}
          />

          <section id="station-watch" className="scroll-mt-36 space-y-3">
            {SHOW_PLACEHOLDER_VIDEO_STRIP ? (
              <VideoStripV2 />
            ) : (
              <VideoSection
                videoUrl={videoUrl}
                moduleId={moduleId}
                pillarSlug={pillarSlug}
                moduleSlug={moduleSlug}
                videoWatched={progress.video_watched}
              />
            )}
          </section>

          <section id="station-read" className="scroll-mt-36 space-y-4">
            <h2 className="flex items-center gap-2 text-2xl font-semibold">
              <BookOpen className="size-5 text-lift" />
              Read the workbook
            </h2>
            <WorkbookBlocksV2
              overview={workbookOverview}
              blocks={workbookBlocks}
              completionCheck={completionCheck}
            />
          </section>

          <ExerciseSection
            sectionId="station-do"
            variant="lift"
            moduleId={moduleId}
            pillarSlug={pillarSlug}
            moduleSlug={moduleSlug}
            exercises={exercises}
            videoWatched={progress.video_watched}
            exercisesSubmitted={progress.exercises_submitted}
            savedResponses={savedResponses}
            savedAnswers={savedAnswers}
            defaultAnswerVisibility={defaultAnswerVisibility}
            hasAnySavedAnswers={hasAnySavedAnswers}
          />

          <QuizSection
            sectionId="station-check"
            variant="lift"
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
