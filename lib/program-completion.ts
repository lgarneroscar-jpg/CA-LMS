import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getExpectedWeek } from "@/lib/pace";
import { buildXpBreakdown } from "@/lib/xp";
import { createNotification } from "@/lib/notifications";

type DbClient = SupabaseClient<Database>;

const CONTENT_MODULE_COUNT = 14;
const LIVE_SESSION_COUNT = 4;

export async function checkProgramCompletion(
  supabase: DbClient,
  params: {
    studentId: string;
    institutionId: string | null;
    studentName: string | null;
    institutionName: string | null;
  }
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("program_completed_at")
    .eq("id", params.studentId)
    .single();

  if (profile?.program_completed_at) {
    return { justCompleted: false, completedAt: profile.program_completed_at };
  }

  const { data: allModules } = await supabase
    .from("modules")
    .select("id, is_live_session");

  const moduleIds = (allModules ?? []).map((m) => m.id);
  if (moduleIds.length === 0) {
    return { justCompleted: false, completedAt: null };
  }

  const { data: progress } = await supabase
    .from("student_progress")
    .select("module_id, is_complete")
    .eq("student_id", params.studentId)
    .in("module_id", moduleIds);

  const completeSet = new Set(
    (progress ?? []).filter((p) => p.is_complete).map((p) => p.module_id)
  );

  const contentComplete = (allModules ?? [])
    .filter((m) => !m.is_live_session)
    .every((m) => completeSet.has(m.id));

  const liveComplete = (allModules ?? [])
    .filter((m) => m.is_live_session)
    .every((m) => completeSet.has(m.id));

  if (
    !contentComplete ||
    !liveComplete ||
    (allModules ?? []).filter((m) => !m.is_live_session).length <
      CONTENT_MODULE_COUNT ||
    (allModules ?? []).filter((m) => m.is_live_session).length <
      LIVE_SESSION_COUNT
  ) {
    return { justCompleted: false, completedAt: null };
  }

  const completedAt = new Date().toISOString();
  await supabase
    .from("profiles")
    .update({ program_completed_at: completedAt })
    .eq("id", params.studentId);

  await createNotification(supabase, {
    userId: params.studentId,
    type: "program_complete",
    message:
      "Congratulations! You completed Corporate Academy. View your certificate from your dashboard.",
  });

  return { justCompleted: true, completedAt };
}

export async function fetchXpBreakdownForStudent(
  supabase: DbClient,
  studentId: string,
  programStartedAt: string | null
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, streak_milestones_awarded")
    .eq("id", studentId)
    .single();

  const { data: modules } = await supabase
    .from("modules")
    .select("id, unlock_week, is_live_session");

  const { data: quizCounts } = await supabase
    .from("quiz_questions")
    .select("module_id");

  const quizTotalByModule = new Map<string, number>();
  (quizCounts ?? []).forEach((q) => {
    quizTotalByModule.set(
      q.module_id,
      (quizTotalByModule.get(q.module_id) ?? 0) + 1
    );
  });

  const { data: progress } = await supabase
    .from("student_progress")
    .select("module_id, quiz_score, xp_earned, is_complete, completed_at")
    .eq("student_id", studentId)
    .eq("is_complete", true);

  const moduleMap = new Map((modules ?? []).map((m) => [m.id, m]));

  const completedModules = (progress ?? []).map((p) => {
    const mod = moduleMap.get(p.module_id);
    const completedAt = p.completed_at ? new Date(p.completed_at) : new Date();
    const expectedAtCompletion = getExpectedWeek(programStartedAt, completedAt);
    return {
      xp_earned: p.xp_earned,
      quiz_score: p.quiz_score,
      quiz_total: quizTotalByModule.get(p.module_id) ?? 0,
      completed_on_time:
        mod != null &&
        !mod.is_live_session &&
        programStartedAt != null &&
        mod.unlock_week === expectedAtCompletion,
      is_live_session: mod?.is_live_session ?? false,
    };
  });

  const milestones =
    (profile?.streak_milestones_awarded as number[] | null) ?? [];

  return {
    breakdown: buildXpBreakdown({
      completedModules,
      streakMilestonesAwarded: milestones,
    }),
    profileXp: profile?.xp ?? 0,
  };
}
