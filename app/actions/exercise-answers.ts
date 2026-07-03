"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { getOrCreateProgress } from "@/lib/progress";
import type { ExerciseAnswerData } from "@/lib/exercise-answers";
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
  if (!progress.video_watched) {
    throw new Error("Watch the video before saving exercises");
  }

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

  if (!progress.video_watched) {
    throw new Error("Watch the video before continuing");
  }

  const { data: savedRows, error: fetchError } = await supabase
    .from("exercise_answers")
    .select("exercise_key")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .in("exercise_key", exerciseKeys);

  if (fetchError) throw new Error(fetchError.message);

  const savedKeys = new Set((savedRows ?? []).map((r) => r.exercise_key));
  const missing = exerciseKeys.filter((k) => !savedKeys.has(k));
  if (missing.length > 0) {
    throw new Error("Save every exercise before continuing to the quiz");
  }

  await supabase
    .from("student_progress")
    .update({ exercises_submitted: true })
    .eq("id", progress.id);

  revalidateModulePaths(pillarSlug, moduleSlug);
  return { success: true };
}
