export const XP_REWARDS = {
  moduleComplete: 100,
  perfectQuiz: 25,
  onTimeBonus: 15,
  liveSessionAttendance: 50,
  streakMilestone: {
    2: 25,
    4: 50,
    8: 100,
    12: 150,
  },
} as const;

export function calculateModuleXp(params: {
  quizScore: number | null;
  quizQuestionCount: number;
  completedOnTime: boolean;
}): number {
  let xp = XP_REWARDS.moduleComplete;

  if (
    params.quizScore !== null &&
    params.quizQuestionCount > 0 &&
    params.quizScore === params.quizQuestionCount
  ) {
    xp += XP_REWARDS.perfectQuiz;
  }

  if (params.completedOnTime) {
    xp += XP_REWARDS.onTimeBonus;
  }

  return xp;
}

export type XpBreakdownLine = {
  label: string;
  xp: number;
  count?: number;
};

export function buildXpBreakdown(params: {
  completedModules: {
    xp_earned: number;
    quiz_score: number | null;
    quiz_total: number;
    completed_on_time: boolean;
    is_live_session: boolean;
  }[];
  streakMilestonesAwarded: number[];
}): { lines: XpBreakdownLine[]; total: number } {
  let baseModules = 0;
  let perfectQuiz = 0;
  let onTime = 0;
  let liveSessions = 0;
  let perfectCount = 0;
  let onTimeCount = 0;
  let liveCount = 0;

  for (const row of params.completedModules) {
    if (row.is_live_session) {
      liveSessions += XP_REWARDS.liveSessionAttendance;
      liveCount += 1;
      continue;
    }

    baseModules += XP_REWARDS.moduleComplete;

    if (
      row.quiz_score !== null &&
      row.quiz_total > 0 &&
      row.quiz_score === row.quiz_total
    ) {
      perfectQuiz += XP_REWARDS.perfectQuiz;
      perfectCount += 1;
    }

    if (row.completed_on_time) {
      onTime += XP_REWARDS.onTimeBonus;
      onTimeCount += 1;
    }
  }

  let streakXp = 0;
  for (const milestone of params.streakMilestonesAwarded) {
    const bonus =
      XP_REWARDS.streakMilestone[
        milestone as keyof typeof XP_REWARDS.streakMilestone
      ];
    if (bonus) streakXp += bonus;
  }

  const lines: XpBreakdownLine[] = [
    {
      label: "Module completion",
      xp: baseModules,
      count: params.completedModules.filter((m) => !m.is_live_session).length,
    },
  ];

  if (perfectQuiz > 0) {
    lines.push({
      label: "Perfect quiz bonus",
      xp: perfectQuiz,
      count: perfectCount,
    });
  }

  if (onTime > 0) {
    lines.push({
      label: "On-time completion bonus",
      xp: onTime,
      count: onTimeCount,
    });
  }

  if (liveSessions > 0) {
    lines.push({
      label: "Live session attendance",
      xp: liveSessions,
      count: liveCount,
    });
  }

  if (streakXp > 0) {
    lines.push({
      label: "Streak milestones",
      xp: streakXp,
      count: params.streakMilestonesAwarded.length,
    });
  }

  const total = lines.reduce((sum, line) => sum + line.xp, 0);
  return { lines, total };
}
