import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeExerciseField } from "@/lib/content-normalize";
import { parseAnswerData, type ExerciseAnswerData } from "@/lib/exercise-answers";
import { getPillarLabel, getPillarSlug } from "@/lib/program";
import { parseModuleNumber } from "@/lib/program-nav";
import type { Database } from "@/types/database";
import type { ExerciseFieldPrompt, ExerciseInputType } from "@/types/modules";
import { isStructuredExercise } from "@/types/modules";

export type WorkbookPortfolioEntry = {
  answerId: string;
  exerciseKey: string;
  title: string;
  inputType: ExerciseInputType;
  fields: ExerciseFieldPrompt[];
  options?: string[];
  answer: ExerciseAnswerData;
  isPublic: boolean;
  updatedAt: string;
  moduleId: string;
  moduleCode: string;
  moduleTitle: string;
  moduleSlug: string;
  pillarSlug: string;
};

export type WorkbookPortfolioModule = {
  moduleId: string;
  moduleCode: string;
  moduleTitle: string;
  moduleSlug: string;
  pillarSlug: string;
  exercises: WorkbookPortfolioEntry[];
};

export type WorkbookPortfolioPillar = {
  pillar: number;
  pillarLabel: string;
  pillarSlug: string;
  modules: WorkbookPortfolioModule[];
};

type ModuleRow = {
  id: string;
  module_code: string;
  title: string;
  slug: string | null;
  pillar: number;
  exercises: unknown;
};

type AnswerRow = {
  id: string;
  module_id: string;
  exercise_key: string;
  answer: unknown;
  is_public: boolean;
  updated_at: string;
};

function parseModuleExercises(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) =>
      item && typeof item === "object"
        ? normalizeExerciseField(item as Record<string, unknown>)
        : null
    )
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

export function buildWorkbookPortfolio(
  answers: AnswerRow[],
  modules: ModuleRow[]
): WorkbookPortfolioPillar[] {
  const answersByModule = new Map<string, AnswerRow[]>();
  for (const row of answers) {
    const list = answersByModule.get(row.module_id) ?? [];
    list.push(row);
    answersByModule.set(row.module_id, list);
  }

  const moduleById = new Map(modules.map((module) => [module.id, module]));
  const pillars: WorkbookPortfolioPillar[] = [];

  for (const pillar of [1, 2, 3] as const) {
    const pillarModules = modules
      .filter((module) => module.pillar === pillar && answersByModule.has(module.id))
      .sort(
        (a, b) =>
          parseModuleNumber(a.module_code) - parseModuleNumber(b.module_code)
      );

    const portfolioModules: WorkbookPortfolioModule[] = [];

    for (const module of pillarModules) {
      const moduleAnswers = answersByModule.get(module.id) ?? [];
      const answerByKey = new Map(
        moduleAnswers.map((row) => [row.exercise_key, row])
      );
      const exerciseDefs = parseModuleExercises(module.exercises).filter(
        isStructuredExercise
      );
      const pillarSlug = getPillarSlug(module.pillar) ?? "program";
      const moduleSlug = module.slug ?? module.id;

      const exercises: WorkbookPortfolioEntry[] = [];

      for (const exercise of exerciseDefs) {
        const row = answerByKey.get(exercise.key);
        if (!row) continue;

        exercises.push({
          answerId: row.id,
          exerciseKey: exercise.key,
          title: exercise.title,
          inputType: exercise.input_type,
          fields: exercise.fields,
          options: exercise.options,
          answer: parseAnswerData(row.answer),
          isPublic: row.is_public,
          updatedAt: row.updated_at,
          moduleId: module.id,
          moduleCode: module.module_code,
          moduleTitle: module.title,
          moduleSlug,
          pillarSlug,
        });
      }

      if (exercises.length > 0) {
        portfolioModules.push({
          moduleId: module.id,
          moduleCode: module.module_code,
          moduleTitle: module.title,
          moduleSlug,
          pillarSlug,
          exercises,
        });
      }
    }

    if (portfolioModules.length > 0) {
      pillars.push({
        pillar,
        pillarLabel: getPillarLabel(pillar),
        pillarSlug: getPillarSlug(pillar) ?? "program",
        modules: portfolioModules,
      });
    }
  }

  return pillars;
}

export async function fetchWorkbookPortfolio(
  supabase: SupabaseClient<Database>,
  studentId: string,
  options: { publicOnly?: boolean } = {}
): Promise<WorkbookPortfolioPillar[]> {
  let answersQuery = supabase
    .from("exercise_answers")
    .select("id, module_id, exercise_key, answer, is_public, updated_at")
    .eq("user_id", studentId);

  if (options.publicOnly) {
    answersQuery = answersQuery.eq("is_public", true);
  }

  const [{ data: answers, error: answersError }, { data: modules, error: modulesError }] =
    await Promise.all([
      answersQuery,
      supabase
        .from("modules")
        .select("id, module_code, title, slug, pillar, exercises")
        .eq("is_live_session", false),
    ]);

  if (answersError) throw new Error(answersError.message);
  if (modulesError) throw new Error(modulesError.message);

  return buildWorkbookPortfolio(answers ?? [], modules ?? []);
}
