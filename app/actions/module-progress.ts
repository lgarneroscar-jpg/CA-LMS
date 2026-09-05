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
import { isStructuredExercise } from "@/types/modules";
import {
  assertExercisesSubmitted,
  assertVideoWatched,
  EXERCISE_SUBMIT_GATE_ENABLED,
  isQuizPassingScore,
  quizPassCorrectCount,
} from "@/lib/module-gates";
import { normalizeExerciseField } from "@/lib/content-normalize";
import {
  isAnswerEmpty,
  parseAnswerData,
} from "@/lib/exercise-answers";

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

  assertVideoWatched(
    progress.video_watched,
    "Watch the video before submitting exercises"
  );

  for (const field of exerciseFields) {
    if (isStructuredExercise(field)) {
      await supabase.from("exercise_responses").upsert(
        {
          student_id: user.id,
          module_id: moduleId,
          exercise_key: field.key,
          response: "reviewed",
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "student_id,module_id,exercise_key" }
      );
      continue;
    }

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

  assertExercisesSubmitted(
    progress.exercises_submitted,
    "Finish every workbook exercise before taking the quiz"
  );

  if (EXERCISE_SUBMIT_GATE_ENABLED) {
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
              ExerciseField,
              { input_type: string; fields: { key: string; label: string }[] }
            > => field !== null && isStructuredExercise(field)
          )
      : [];

    if (exerciseDefs.length > 0) {
      const { data: savedRows, error: answersError } = await supabase
        .from("exercise_answers")
        .select("exercise_key, answer")
        .eq("user_id", user.id)
        .eq("module_id", moduleId)
        .in(
          "exercise_key",
          exerciseDefs.map((exercise) => exercise.key)
        );
      if (answersError) throw new Error(answersError.message);

      const answerByKey = new Map(
        (savedRows ?? []).map((row) => [row.exercise_key, row.answer])
      );
      const missingTitles: string[] = [];
      for (const def of exerciseDefs) {
        const raw = answerByKey.get(def.key);
        if (
          raw === undefined ||
          isAnswerEmpty(
            def.input_type,
            parseAnswerData(raw),
            def.fields,
            def.key
          )
        ) {
          missingTitles.push(def.title || def.label);
        }
      }
      if (missingTitles.length > 0) {
        // Clear stale exercises_submitted so the UI re-locks until fixed.
        await supabase
          .from("student_progress")
          .update({ exercises_submitted: false })
          .eq("id", progress.id);
        const listed = missingTitles.join(", ");
        throw new Error(
          missingTitles.length === 1
            ? `Finish “${listed}” before taking the quiz`
            : `Finish these exercises before taking the quiz: ${listed}`
        );
      }
    }
  }

  const total = questionIds.length;
  let score = 0;
  for (const qId of questionIds) {
    if (answers[qId] === correctAnswers[qId]) score += 1;
  }

  // Latest attempt wins — do not keep a prior best score.
  const passed = isQuizPassingScore(score, total);

  await supabase
    .from("student_progress")
    .update({
      quiz_score: score,
      // quiz_completed means passed at threshold, not merely attempted.
      quiz_completed: passed,
    })
    .eq("id", progress.id);

  let moduleCompleted = false;
  let xpEarned = 0;
  let programJustCompleted = false;
  let certificateStudentId: string | undefined;

  if (passed) {
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
      quizQuestionCount: total,
      institutionId: ctx.institutionId,
      studentName: profile.full_name,
      institutionName: ctx.institutionName,
      studentEmail: ctx.studentEmail,
    });

    moduleCompleted = result.completed;
    xpEarned = result.xpEarned;
    programJustCompleted = result.programJustCompleted ?? false;
    certificateStudentId = result.certificateStudentId;
  }

  revalidateModulePaths(pillarSlug, moduleSlug);
  return {
    success: true,
    score,
    total,
    passed,
    passRequired: quizPassCorrectCount(total),
    moduleCompleted,
    xpEarned,
    programJustCompleted,
    certificateStudentId,
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
