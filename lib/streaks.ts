import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getProgramWeek } from "@/lib/drip";
import { createNotification } from "@/lib/notifications";
import { XP_REWARDS } from "@/lib/xp";

type DbClient = SupabaseClient<Database>;

export const STREAK_MILESTONES = [2, 4, 8, 12] as const;

export const STREAK_BADGES: Record<number, string> = {
  2: "Momentum Builder",
  4: "Consistency Champion",
  8: "Habit Master",
  12: "Unstoppable Streak",
};

export type StreakMilestoneEntry = {
  weeks: number;
  badge: string;
  xp: number;
};

export function buildStreakHistory(
  milestonesAwarded: number[]
): StreakMilestoneEntry[] {
  return [...milestonesAwarded]
    .sort((a, b) => a - b)
    .map((weeks) => ({
      weeks,
      badge: STREAK_BADGES[weeks] ?? "Streak milestone",
      xp:
        XP_REWARDS.streakMilestone[
          weeks as keyof typeof XP_REWARDS.streakMilestone
        ] ?? 0,
    }));
}

export async function refreshStreakIfLapsed(
  supabase: DbClient,
  studentId: string,
  programStartedAt: string | null
) {
  const currentWeek = getProgramWeek(programStartedAt);
  if (currentWeek <= 0) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("streak_days, last_active_week")
    .eq("id", studentId)
    .single();

  if (!profile?.last_active_week) return;

  if (currentWeek - profile.last_active_week >= 2 && profile.streak_days > 0) {
    await supabase
      .from("profiles")
      .update({ streak_days: 0 })
      .eq("id", studentId);
  }
}

export async function updateWeeklyStreakOnActivity(
  supabase: DbClient,
  params: {
    studentId: string;
    programStartedAt: string | null;
  }
) {
  const currentWeek = getProgramWeek(params.programStartedAt);
  if (currentWeek <= 0) return { streak: 0, milestoneAwarded: null as number | null };

  await refreshStreakIfLapsed(supabase, params.studentId, params.programStartedAt);

  const { data: profile } = await supabase
    .from("profiles")
    .select("streak_days, last_active_week, streak_milestones_awarded, earned_badges, xp")
    .eq("id", params.studentId)
    .single();

  if (!profile) return { streak: 0, milestoneAwarded: null as number | null };

  let streak = profile.streak_days ?? 0;
  const lastWeek = profile.last_active_week;

  if (lastWeek === currentWeek) {
    return { streak, milestoneAwarded: null };
  }

  if (lastWeek === null || lastWeek === undefined) {
    streak = 1;
  } else if (lastWeek === currentWeek - 1) {
    streak += 1;
  } else {
    streak = 1;
  }

  await supabase
    .from("profiles")
    .update({
      streak_days: streak,
      last_active_week: currentWeek,
      last_active_date: new Date().toISOString().slice(0, 10),
    })
    .eq("id", params.studentId);

  const awarded = (profile.streak_milestones_awarded as number[]) ?? [];
  let milestoneAwarded: number | null = null;
  let bonusXp = 0;
  const badges = [...((profile.earned_badges as string[]) ?? [])];

  for (const milestone of STREAK_MILESTONES) {
    if (streak >= milestone && !awarded.includes(milestone)) {
      awarded.push(milestone);
      milestoneAwarded = milestone;
      bonusXp = XP_REWARDS.streakMilestone[milestone];
      const badge = STREAK_BADGES[milestone];
      if (badge && !badges.includes(badge)) badges.push(badge);

      await createNotification(supabase, {
        userId: params.studentId,
        type: "streak_milestone",
        message: `${milestone}-week streak! You earned the "${badge}" badge (+${bonusXp} XP).`,
      });
    }
  }

  if (milestoneAwarded !== null) {
    await supabase
      .from("profiles")
      .update({
        streak_milestones_awarded: awarded,
        earned_badges: badges,
        xp: (profile.xp ?? 0) + bonusXp,
      })
      .eq("id", params.studentId);
  }

  return { streak, milestoneAwarded };
}
