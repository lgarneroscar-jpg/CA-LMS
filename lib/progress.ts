import { createClient } from "@/lib/supabase/server";
import { calculateModuleXp, XP_REWARDS } from "@/lib/xp";
import { getExpectedWeek } from "@/lib/pace";
import { recalculateCohortRanksAndNotify } from "@/lib/rankings";
import { updateWeeklyStreakOnActivity } from "@/lib/streaks";
import { checkProgramCompletion } from "@/lib/program-completion";
import { sendProgramCompletionEmail } from "@/lib/email";
import type { ModuleProgressState } from "@/types/modules";
import type { Tables } from "@/types/database";

export type StudentProgressRow = Tables<"student_progress">;

export async function getOrCreateProgress(
  studentId: string,
  moduleId: string
): Promise<StudentProgressRow> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("student_progress")
    .select("*")
    .eq("student_id", studentId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("student_progress")
    .insert({ student_id: studentId, module_id: moduleId })
    .select("*")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Failed to create progress");
  }

  return created;
}

export function toProgressState(row: StudentProgressRow): ModuleProgressState {
  return {
    video_watched: row.video_watched,
    exercises_submitted: row.exercises_submitted,
    quiz_completed: row.quiz_completed,
    quiz_score: row.quiz_score,
    is_complete: row.is_complete,
    xp_earned: row.xp_earned,
  };
}

export async function tryCompleteModule(params: {
  studentId: string;
  moduleId: string;
  unlockWeek: number;
  programStartedAt: string | null;
  quizQuestionCount: number;
  institutionId: string | null;
  studentName: string | null;
  institutionName: string | null;
  studentEmail?: string | null;
}): Promise<{
  completed: boolean;
  xpEarned: number;
  progress: StudentProgressRow;
  programJustCompleted?: boolean;
  certificateStudentId?: string;
}> {
  const supabase = await createClient();
  const progress = await getOrCreateProgress(params.studentId, params.moduleId);

  if (progress.is_complete) {
    return { completed: false, xpEarned: progress.xp_earned, progress };
  }

  if (
    !progress.video_watched ||
    !progress.exercises_submitted ||
    !progress.quiz_completed
  ) {
    return { completed: false, xpEarned: 0, progress };
  }

  const expectedWeek = getExpectedWeek(
    params.programStartedAt,
    new Date()
  );
  const completedOnTime =
    params.programStartedAt != null && params.unlockWeek === expectedWeek;

  const xpEarned = calculateModuleXp({
    quizScore: progress.quiz_score,
    quizQuestionCount: params.quizQuestionCount,
    completedOnTime,
  });

  const { data: updated, error } = await supabase
    .from("student_progress")
    .update({
      is_complete: true,
      completed_at: new Date().toISOString(),
      xp_earned: xpEarned,
    })
    .eq("id", progress.id)
    .select("*")
    .single();

  if (error || !updated) {
    throw new Error(error?.message ?? "Failed to complete module");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp")
    .eq("id", params.studentId)
    .single();

  await supabase
    .from("profiles")
    .update({ xp: (profile?.xp ?? 0) + xpEarned })
    .eq("id", params.studentId);

  await updateWeeklyStreakOnActivity(supabase, {
    studentId: params.studentId,
    programStartedAt: params.programStartedAt,
  });

  if (params.institutionId) {
    await recalculateCohortRanksAndNotify(supabase, {
      institutionId: params.institutionId,
      studentId: params.studentId,
    });
  }

  const completion = await checkProgramCompletion(supabase, {
    studentId: params.studentId,
    institutionId: params.institutionId,
    studentName: params.studentName,
    institutionName: params.institutionName,
  });

  if (completion.justCompleted && params.studentEmail) {
    await sendProgramCompletionEmail({
      to: params.studentEmail,
      studentName: params.studentName ?? "Student",
      institutionName: params.institutionName ?? "Corporate Academy",
      studentId: params.studentId,
      completedAt: completion.completedAt ?? new Date().toISOString(),
    });
  }

  return {
    completed: true,
    xpEarned,
    progress: updated,
    programJustCompleted: completion.justCompleted,
    certificateStudentId: completion.justCompleted
      ? params.studentId
      : undefined,
  };
}

export async function markLiveSessionAttended(params: {
  studentId: string;
  moduleId: string;
  programStartedAt: string | null;
  institutionId: string | null;
  studentName: string | null;
  institutionName: string | null;
  studentEmail?: string | null;
}) {
  const supabase = await createClient();
  const progress = await getOrCreateProgress(params.studentId, params.moduleId);

  if (progress.is_complete) {
    return { completed: false, xpEarned: progress.xp_earned };
  }

  const xpEarned = XP_REWARDS.liveSessionAttendance;

  await supabase
    .from("student_progress")
    .update({
      is_complete: true,
      completed_at: new Date().toISOString(),
      xp_earned: xpEarned,
      video_watched: true,
    })
    .eq("id", progress.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp")
    .eq("id", params.studentId)
    .single();

  await supabase
    .from("profiles")
    .update({ xp: (profile?.xp ?? 0) + xpEarned })
    .eq("id", params.studentId);

  await updateWeeklyStreakOnActivity(supabase, {
    studentId: params.studentId,
    programStartedAt: params.programStartedAt,
  });

  if (params.institutionId) {
    await recalculateCohortRanksAndNotify(supabase, {
      institutionId: params.institutionId,
      studentId: params.studentId,
    });
  }

  const completion = await checkProgramCompletion(supabase, {
    studentId: params.studentId,
    institutionId: params.institutionId,
    studentName: params.studentName,
    institutionName: params.institutionName,
  });

  if (completion.justCompleted && params.studentEmail) {
    await sendProgramCompletionEmail({
      to: params.studentEmail,
      studentName: params.studentName ?? "Student",
      institutionName: params.institutionName ?? "Corporate Academy",
      studentId: params.studentId,
      completedAt: completion.completedAt ?? new Date().toISOString(),
    });
  }

  return {
    completed: true,
    xpEarned,
    programJustCompleted: completion.justCompleted,
  };
}

export async function recordStudentActivity(
  studentId: string,
  programStartedAt: string | null
) {
  const supabase = await createClient();
  await updateWeeklyStreakOnActivity(supabase, {
    studentId,
    programStartedAt,
  });
}
