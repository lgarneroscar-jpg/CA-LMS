import { normalizeExerciseField } from "@/lib/content-normalize";
import { isAnswerEmpty, parseAnswerData } from "@/lib/exercise-answers";
import { isStructuredExercise, type ExerciseInputType } from "@/types/modules";

export type CatalogExercise = {
  moduleId: string;
  moduleCode: string;
  exerciseKey: string;
  inputType: ExerciseInputType;
  fields: { key: string; label: string }[];
};

export type ExerciseAnswerMetaRow = {
  user_id: string;
  module_id: string;
  exercise_key: string;
  answer: unknown;
  updated_at: string;
};

export type StudentWorkbookMetrics = {
  workbookAnswered: number;
  workbookTotal: number;
  workbookPercent: number;
  lastWorkbookActivity: string | null;
  workbookModulesTouched: number;
};

export type ModuleWorkbookBreakdown = {
  moduleId: string;
  moduleCode: string;
  title: string;
  isLiveSession: boolean;
  isComplete: boolean;
  exercisesAnswered: number;
  exercisesTotal: number;
  /** QUIZ_SCORE_IS_RAW_COUNT — divide by quizTotal for display. */
  quizScore: number | null;
  quizTotal: number;
};

export function parseModuleExerciseCatalog(
  modules: {
    id: string;
    module_code: string;
    exercises: unknown;
  }[]
): CatalogExercise[] {
  const catalog: CatalogExercise[] = [];

  for (const module of modules) {
    if (!Array.isArray(module.exercises)) continue;

    for (const raw of module.exercises) {
      if (!raw || typeof raw !== "object") continue;
      const exercise = normalizeExerciseField(raw as Record<string, unknown>);
      if (!exercise || !isStructuredExercise(exercise)) continue;

      catalog.push({
        moduleId: module.id,
        moduleCode: module.module_code,
        exerciseKey: exercise.key,
        inputType: exercise.input_type,
        fields: exercise.fields,
      });
    }
  }

  return catalog;
}

export function countWorkbookTotal(catalog: CatalogExercise[]): number {
  return catalog.length;
}

export function computeStudentWorkbookMetrics(
  studentId: string,
  catalog: CatalogExercise[],
  answers: ExerciseAnswerMetaRow[]
): StudentWorkbookMetrics {
  const studentAnswers = answers.filter((row) => row.user_id === studentId);
  const answerByKey = new Map(
    studentAnswers.map((row) => [`${row.module_id}:${row.exercise_key}`, row])
  );

  let workbookAnswered = 0;
  let lastWorkbookActivity: string | null = null;
  const touchedModules = new Set<string>();

  for (const exercise of catalog) {
    const row = answerByKey.get(`${exercise.moduleId}:${exercise.exerciseKey}`);
    if (!row) continue;

    const data = parseAnswerData(row.answer);
    if (
      isAnswerEmpty(
        exercise.inputType,
        data,
        exercise.fields,
        exercise.exerciseKey
      )
    ) {
      continue;
    }

    workbookAnswered += 1;
    touchedModules.add(exercise.moduleId);
    if (
      !lastWorkbookActivity ||
      new Date(row.updated_at).getTime() > new Date(lastWorkbookActivity).getTime()
    ) {
      lastWorkbookActivity = row.updated_at;
    }
  }

  const workbookTotal = catalog.length;
  const workbookPercent =
    workbookTotal > 0
      ? Math.round((workbookAnswered / workbookTotal) * 100)
      : 0;

  return {
    workbookAnswered,
    workbookTotal,
    workbookPercent,
    lastWorkbookActivity,
    workbookModulesTouched: touchedModules.size,
  };
}

export function formatWorkbookActivityLabel(metrics: {
  workbookAnswered: number;
  workbookTotal: number;
  lastWorkbookActivity: string | null;
}): string {
  if (metrics.workbookAnswered === 0) {
    return "No workbook activity";
  }

  const count = `${metrics.workbookAnswered} of ${metrics.workbookTotal} exercises`;
  if (!metrics.lastWorkbookActivity) {
    return count;
  }

  const days = daysSince(metrics.lastWorkbookActivity);
  const recency =
    days === 0
      ? "today"
      : days === 1
        ? "1 day ago"
        : `${days} days ago`;

  return `${count} · last activity ${recency}`;
}

export function daysSince(isoDate: string, now = new Date()): number {
  const then = new Date(isoDate);
  if (Number.isNaN(then.getTime())) return 0;
  const start = new Date(now.toDateString());
  const end = new Date(then.toDateString());
  return Math.max(
    0,
    Math.round((start.getTime() - end.getTime()) / (24 * 60 * 60 * 1000))
  );
}

export function computeModuleWorkbookBreakdown(params: {
  modules: {
    id: string;
    module_code: string;
    title: string;
    is_live_session: boolean;
    exercises: unknown;
  }[];
  catalog: CatalogExercise[];
  answers: ExerciseAnswerMetaRow[];
  studentId: string;
  quizTotalByModule: Map<string, number>;
  progressByModule: Map<
    string,
    { is_complete: boolean; quiz_score: number | null }
  >;
}): ModuleWorkbookBreakdown[] {
  const { modules, catalog, answers, studentId, quizTotalByModule, progressByModule } =
    params;

  const exercisesByModule = new Map<string, CatalogExercise[]>();
  for (const exercise of catalog) {
    const list = exercisesByModule.get(exercise.moduleId) ?? [];
    list.push(exercise);
    exercisesByModule.set(exercise.moduleId, list);
  }

  const studentAnswers = answers.filter((row) => row.user_id === studentId);
  const answerByKey = new Map(
    studentAnswers.map((row) => [`${row.module_id}:${row.exercise_key}`, row])
  );

  return modules.map((module) => {
    const moduleExercises = exercisesByModule.get(module.id) ?? [];
    let exercisesAnswered = 0;

    for (const exercise of moduleExercises) {
      const row = answerByKey.get(`${exercise.moduleId}:${exercise.exerciseKey}`);
      if (!row) continue;
      const data = parseAnswerData(row.answer);
      if (
        !isAnswerEmpty(
          exercise.inputType,
          data,
          exercise.fields,
          exercise.exerciseKey
        )
      ) {
        exercisesAnswered += 1;
      }
    }

    const progress = progressByModule.get(module.id);
    const quizTotal = quizTotalByModule.get(module.id) ?? 0;

    return {
      moduleId: module.id,
      moduleCode: module.module_code,
      title: module.title,
      isLiveSession: module.is_live_session,
      isComplete: progress?.is_complete ?? false,
      exercisesAnswered,
      exercisesTotal: moduleExercises.length,
      quizScore: progress?.quiz_score ?? null,
      quizTotal,
    };
  });
}

export function formatQuizScoreDisplay(
  quizScore: number | null,
  quizTotal: number
): string | null {
  if (quizTotal <= 0 || quizScore == null) return null;
  const percent = Math.round((quizScore / quizTotal) * 100);
  return `${quizScore} of ${quizTotal} (${percent}%)`;
}

export function isLowQuizScore(
  quizScore: number | null,
  quizTotal: number
): boolean {
  if (quizTotal <= 0 || quizScore == null) return false;
  return quizScore / quizTotal < 0.5;
}
