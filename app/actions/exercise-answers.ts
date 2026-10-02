"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";
import { getOrCreateProgress } from "@/lib/progress";
import { assertVideoWatched } from "@/lib/module-gates";
import {
  isAnswerEmpty,
  parseAnswerData,
  type ExerciseAnswerData,
} from "@/lib/exercise-answers";
import { normalizeExerciseField } from "@/lib/content-normalize";
import { isStructuredExercise } from "@/types/modules";
import type { Json } from "@/types/database";

async function requireStudent() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, default_answer_visibility")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "student") {
    throw new Error("Students only");
  }

  return { user, profile, supabase };
}

function revalidateModulePaths(pillarSlug: string, moduleSlug: string) {
  revalidatePath("/dashboard");
  revalidatePath("/program");
  revalidatePath(`/program/${pillarSlug}/${moduleSlug}`);
  revalidatePath("/profile");
}

export async function getExerciseAnswerContext() {
  const { user, profile, supabase } = await requireStudent();

  const { count } = await supabase
    .from("exercise_answers")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return {
    defaultAnswerVisibility: profile.default_answer_visibility,
    hasAnySavedAnswers: (count ?? 0) > 0,
  };
}

export async function setDefaultAnswerVisibility(isPublic: boolean) {
  const { user, supabase } = await requireStudent();

  const { error } = await supabase
    .from("profiles")
    .update({ default_answer_visibility: isPublic })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/profile");
  return { success: true, isPublic };
}

export async function setAnswerVisibility(params: {
  answerId: string;
  moduleId: string;
  pillarSlug: string;
  moduleSlug: string;
  isPublic: boolean;
}) {
  const { user, supabase } = await requireStudent();

  const { data, error } = await supabase
    .from("exercise_answers")
    .update({ is_public: params.isPublic })
    .eq("id", params.answerId)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update visibility");
  }

  revalidateModulePaths(params.pillarSlug, params.moduleSlug);
  revalidatePath("/profile");
  return { success: true, isPublic: params.isPublic };
}

export async function saveExerciseAnswer(params: {
  moduleId: string;
  pillarSlug: string;
  moduleSlug: string;
  exerciseKey: string;
  answer: ExerciseAnswerData;
  isPublic: boolean;
  setDefaultVisibility?: boolean | null;
}) {
  const { user, profile, supabase } = await requireStudent();

  const progress = await getOrCreateProgress(user.id, params.moduleId);
  assertVideoWatched(
    progress.video_watched,
    "Watch the video before saving exercises"
  );

  if (
    params.setDefaultVisibility !== undefined &&
    params.setDefaultVisibility !== null &&
    profile.default_answer_visibility === null
  ) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ default_answer_visibility: params.setDefaultVisibility })
      .eq("id", user.id);

    if (profileError) throw new Error(profileError.message);
  }

  const { data, error } = await supabase
    .from("exercise_answers")
    .upsert(
      {
        user_id: user.id,
        module_id: params.moduleId,
        exercise_key: params.exerciseKey,
        answer: params.answer as unknown as Json,
        is_public: params.isPublic,
      },
      { onConflict: "user_id,module_id,exercise_key" }
    )
    .select("updated_at, is_public")
    .single();

  if (error) throw new Error(error.message);

  revalidateModulePaths(params.pillarSlug, params.moduleSlug);
  return {
    success: true,
    updatedAt: data.updated_at,
    isPublic: data.is_public,
  };
}

export async function markExercisesReadyForQuiz(
  moduleId: string,
  pillarSlug: string,
  moduleSlug: string,
  exerciseKeys: string[]
) {
  const { user, supabase } = await requireStudent();
  const progress = await getOrCreateProgress(user.id, moduleId);
  assertVideoWatched(progress.video_watched, "Watch the video before continuing");

  const { data: moduleRow, error: moduleError } = await supabase
    .from("modules")
    .select("exercises")
    .eq("id", moduleId)
    .single();

  if (moduleError) throw new Error(moduleError.message);

  const exerciseDefs = Array.isArray(moduleRow?.exercises)
    ? moduleRow.exercises
        .map((item) =>
          item && typeof item === "object"
            ? normalizeExerciseField(item as Record<string, unknown>)
            : null
        )
        .filter(
          (
            field
          ): field is Extract<
            import("@/types/modules").ExerciseField,
            { input_type: string; fields: { key: string; label: string }[] }
          > => field !== null && isStructuredExercise(field)
        )
    : [];

  const requiredKeys =
    exerciseKeys.length > 0
      ? exerciseKeys
      : exerciseDefs.map((exercise) => exercise.key);

  const { data: savedRows, error: fetchError } = await supabase
    .from("exercise_answers")
    .select("exercise_key, answer")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .in("exercise_key", requiredKeys);

  if (fetchError) throw new Error(fetchError.message);

  const answerByKey = new Map(
    (savedRows ?? []).map((row) => [row.exercise_key, row.answer])
  );

  const missingTitles: string[] = [];
  for (const key of requiredKeys) {
    const def = exerciseDefs.find((exercise) => exercise.key === key);
    const title = def?.title || def?.label || key;
    const raw = answerByKey.get(key);
    if (raw === undefined) {
      missingTitles.push(title);
      continue;
    }
    if (!def) {
      const data = parseAnswerData(raw);
      if (Object.keys(data.values).length === 0) {
        missingTitles.push(title);
      }
      continue;
    }
    const data = parseAnswerData(raw);
    if (isAnswerEmpty(def.input_type, data, def.fields, def.key)) {
      missingTitles.push(title);
    }
  }

  if (missingTitles.length > 0) {
    const listed = missingTitles.join(", ");
    throw new Error(
      missingTitles.length === 1
        ? `Finish “${listed}” before continuing to the quiz`
        : `Finish these exercises before continuing to the quiz: ${listed}`
    );
  }

  await createAdminClient()
    .from("student_progress")
    .update({ exercises_submitted: true })
    .eq("id", progress.id)
    .eq("student_id", user.id);

  revalidateModulePaths(pillarSlug, moduleSlug);
  return { success: true };
}
