"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import {
  getOrCreateProgress,
  markLiveSessionAttended,
  tryCompleteModule,
} from "@/lib/progress";
import type { ExerciseField } from "@/types/modules";

async function requireStudent() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, institution_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "student") {
    throw new Error("Students only");
  }

  return { user, profile, supabase };
}

async function getStudentContext(profile: {
  id: string;
  institution_id: string | null;
  full_name: string | null;
}) {
  const supabase = await createClient();
  const { data: institution } = profile.institution_id
    ? await supabase
        .from("institutions")
        .select("name")
        .eq("id", profile.institution_id)
        .single()
    : { data: null };

  const { data: fullProfile } = await supabase
    .from("profiles")
    .select("program_started_at")
    .eq("id", profile.id)
    .single();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    programStartedAt: fullProfile?.program_started_at ?? null,
    institutionName: institution?.name ?? null,
    institutionId: profile.institution_id,
    studentEmail: user?.email ?? null,
  };
}

function revalidateModulePaths(pillarSlug: string, moduleSlug: string) {
  revalidatePath("/dashboard");
  revalidatePath("/program");
  revalidatePath(`/program/${pillarSlug}/${moduleSlug}`);
}

export async function markVideoWatched(
  moduleId: string,
  pillarSlug: string,
  moduleSlug: string
) {
  const { user, supabase } = await requireStudent();
  const progress = await getOrCreateProgress(user.id, moduleId);

  await supabase
    .from("student_progress")
    .update({ video_watched: true })
    .eq("id", progress.id);

  revalidateModulePaths(pillarSlug, moduleSlug);
  return { success: true };
}

export async function submitExercises(
  moduleId: string,
  pillarSlug: string,
  moduleSlug: string,
  responses: Record<string, string>,
  exerciseFields: ExerciseField[]
) {
  const { user, supabase } = await requireStudent();
  const progress = await getOrCreateProgress(user.id, moduleId);

  if (!progress.video_watched) {
    throw new Error("Watch the video before submitting exercises");
  }

  for (const field of exerciseFields) {
    const value = responses[field.key]?.trim() ?? "";
    if (field.type === "checkbox") {
      if (value !== "true") {
        throw new Error(`Complete all checklist items`);
      }
    } else if (!value) {
      throw new Error(`Please answer: ${field.label}`);
    }

    await supabase.from("exercise_responses").upsert(
      {
        student_id: user.id,
        module_id: moduleId,
        exercise_key: field.key,
        response: value,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "student_id,module_id,exercise_key" }
    );
  }

  await supabase
    .from("student_progress")
    .update({ exercises_submitted: true })
    .eq("id", progress.id);

  revalidateModulePaths(pillarSlug, moduleSlug);
  return { success: true };
}

export async function submitQuiz(
  moduleId: string,
  pillarSlug: string,
  moduleSlug: string,
  answers: Record<string, string>,
  questionIds: string[],
  correctAnswers: Record<string, string>
) {
  const { user, profile, supabase } = await requireStudent();
  const progress = await getOrCreateProgress(user.id, moduleId);

  if (!progress.exercises_submitted) {
    throw new Error("Submit exercises before taking the quiz");
  }

  let score = 0;
  for (const qId of questionIds) {
    if (answers[qId] === correctAnswers[qId]) score += 1;
  }

  await supabase
    .from("student_progress")
    .update({
      quiz_completed: true,
      quiz_score: score,
    })
    .eq("id", progress.id);

  const { data: module } = await supabase
    .from("modules")
    .select("unlock_week")
    .eq("id", moduleId)
    .single();

  const ctx = await getStudentContext(profile);

  const result = await tryCompleteModule({
    studentId: user.id,
    moduleId,
    unlockWeek: module?.unlock_week ?? 1,
    programStartedAt: ctx.programStartedAt,
    quizQuestionCount: questionIds.length,
    institutionId: ctx.institutionId,
    studentName: profile.full_name,
    institutionName: ctx.institutionName,
    studentEmail: ctx.studentEmail,
  });

  revalidateModulePaths(pillarSlug, moduleSlug);
  return {
    success: true,
    score,
    total: questionIds.length,
    moduleCompleted: result.completed,
    xpEarned: result.xpEarned,
    programJustCompleted: result.programJustCompleted ?? false,
    certificateStudentId: result.certificateStudentId,
  };
}

export async function markLiveSessionComplete(
  moduleId: string,
  pillarSlug: string,
  moduleSlug: string
) {
  const { user, profile } = await requireStudent();
  const ctx = await getStudentContext(profile);

  const result = await markLiveSessionAttended({
    studentId: user.id,
    moduleId,
    programStartedAt: ctx.programStartedAt,
    institutionId: ctx.institutionId,
    studentName: profile.full_name,
    institutionName: ctx.institutionName,
    studentEmail: ctx.studentEmail,
  });

  revalidateModulePaths(pillarSlug, moduleSlug);
  revalidatePath("/dashboard");
  revalidatePath("/program");

  return result;
}
