import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getProgramWeek } from "@/lib/drip";
import { getPaceStatus } from "@/lib/pace";
import { getProgressWeek, type ProgressModuleRef } from "@/lib/program";

type DbClient = SupabaseClient<Database>;

export type CohortStudentMetrics = {
  id: string;
  full_name: string | null;
  email: string;
  xp: number;
  rank: number | null;
  last_login: string | null;
  last_active_date: string | null;
  diagnostic_complete: boolean;
  completionPercent: number;
  quizAverage: number;
  isBehindPace: boolean;
  hasFlag: boolean;
  flagNote: string | null;
};

export type CohortAnalytics = {
  currentWeek: number;
  targetWeek: number;
  pacePercent: number;
  overallCompletionRate: number;
  averageQuizScore: number;
  averageXp: number;
  weeklyEngagementScore: number;
  moduleCompletionRates: {
    moduleId: string;
    moduleCode: string;
    title: string;
    completionRate: number;
    completedStudentIds: string[];
    incompleteStudentIds: string[];
  }[];
  topStudents: CohortStudentMetrics[];
  bottomStudents: CohortStudentMetrics[];
  allStudents: CohortStudentMetrics[];
};

function isStudentBehindPace(
  programStartedAt: string | null,
  progressWeek: number
): boolean {
  return getPaceStatus(programStartedAt, progressWeek) === "behind";
}

function getStudentProgressWeek(
  studentId: string,
  modules: ProgressModuleRef[],
  progress: { student_id: string; module_id: string; is_complete: boolean }[]
): number {
  const progressMap = new Map<string, { is_complete: boolean; xp_earned: number }>();
  for (const row of progress) {
    if (row.student_id !== studentId) continue;
    progressMap.set(row.module_id, {
      is_complete: row.is_complete,
      xp_earned: 0,
    });
  }
  return getProgressWeek(modules, progressMap);
}

export async function getCohortAnalytics(
  supabase: DbClient,
  institutionId: string
): Promise<CohortAnalytics | null> {
  const { data: institution } = await supabase
    .from("institutions")
    .select("cohort_start_date")
    .eq("id", institutionId)
    .single();

  if (!institution) return null;

  const currentWeek = getProgramWeek(institution.cohort_start_date);
  const targetWeek = Math.max(1, currentWeek);

  const { data: students } = await supabase
    .from("profiles")
    .select(
      "id, full_name, xp, rank, last_login, last_active_date, diagnostic_complete, program_started_at"
    )
    .eq("institution_id", institutionId)
    .eq("role", "student");

  const studentIds = (students ?? []).map((s) => s.id);
  const cohortSize = studentIds.length || 1;

  const { data: modules } = await supabase
    .from("modules")
    .select("id, module_code, title, unlock_week, is_live_session, order_index")
    .eq("is_live_session", false)
    .order("unlock_week")
    .order("order_index");

  const { data: progress } = await supabase
    .from("student_progress")
    .select("student_id, module_id, is_complete, quiz_score")
    .in("student_id", studentIds.length ? studentIds : ["00000000-0000-0000-0000-000000000000"]);

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

  const { data: flags } = await supabase
    .from("flags")
    .select("student_id, note")
    .in("student_id", studentIds.length ? studentIds : ["00000000-0000-0000-0000-000000000000"]);

  const flagByStudent = new Map(
    (flags ?? []).map((f) => [f.student_id, f.note])
  );

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentLogins } = await supabase
    .from("login_events")
    .select("user_id")
    .in("user_id", studentIds.length ? studentIds : ["00000000-0000-0000-0000-000000000000"])
    .gte("logged_in_at", sevenDaysAgo);

  const activeUsers = new Set((recentLogins ?? []).map((l) => l.user_id));

  const emails = new Map<string, string>();
  for (const student of students ?? []) {
    // Email fetched separately in export; placeholder for analytics list
    emails.set(student.id, "");
  }

  const totalModules = modules?.length ?? 0;
  const targetModules =
    modules?.filter((m) => m.unlock_week <= targetWeek) ?? [];
  const targetModuleIds = new Set(targetModules.map((m) => m.id));

  let paceCompletionSum = 0;
  let paceCompletionCount = 0;

  const moduleCompletionRates = (modules ?? []).map((mod) => {
    const completedStudentIds: string[] = [];
    const incompleteStudentIds: string[] = [];

    for (const student of students ?? []) {
      const row = (progress ?? []).find(
        (p) => p.student_id === student.id && p.module_id === mod.id && p.is_complete
      );
      if (row) completedStudentIds.push(student.id);
      else incompleteStudentIds.push(student.id);
    }

    const rate =
      cohortSize > 0
        ? Math.round((completedStudentIds.length / cohortSize) * 100)
        : 0;

    if (targetModuleIds.has(mod.id)) {
      paceCompletionSum += rate;
      paceCompletionCount += 1;
    }

    return {
      moduleId: mod.id,
      moduleCode: mod.module_code,
      title: mod.title,
      completionRate: rate,
      completedStudentIds,
      incompleteStudentIds,
    };
  });

  const pacePercent =
    paceCompletionCount > 0
      ? Math.round(paceCompletionSum / paceCompletionCount)
      : 0;

  const allStudents: CohortStudentMetrics[] = (students ?? []).map((student) => {
    const studentProgress = (progress ?? []).filter(
      (p) => p.student_id === student.id && p.is_complete
    );
    const completedCount = studentProgress.length;
    const completionPercent =
      totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

    let quizSum = 0;
    let quizCount = 0;
    for (const row of studentProgress) {
      const total = quizTotalByModule.get(row.module_id) ?? 0;
      if (total > 0 && row.quiz_score != null) {
        quizSum += row.quiz_score / total;
        quizCount += 1;
      }
    }

    const progressWeek = getStudentProgressWeek(
      student.id,
      modules ?? [],
      progress ?? []
    );

    return {
      id: student.id,
      full_name: student.full_name,
      email: emails.get(student.id) ?? "",
      xp: student.xp,
      rank: student.rank,
      last_login: student.last_login,
      last_active_date: student.last_active_date,
      diagnostic_complete: student.diagnostic_complete,
      completionPercent,
      quizAverage:
        quizCount > 0 ? Math.round((quizSum / quizCount) * 100) : 0,
      isBehindPace: isStudentBehindPace(
        student.program_started_at,
        progressWeek
      ),
      hasFlag: flagByStudent.has(student.id),
      flagNote: flagByStudent.get(student.id) ?? null,
    };
  });

  const sortedByXp = [...allStudents].sort((a, b) => b.xp - a.xp);
  const topStudents = sortedByXp.slice(0, 10);
  const bottomStudents = allStudents
    .filter((s) => s.isBehindPace)
    .sort((a, b) => a.completionPercent - b.completionPercent)
    .slice(0, 5);

  const overallCompletionRate =
    allStudents.length > 0
      ? Math.round(
          allStudents.reduce((sum, s) => sum + s.completionPercent, 0) /
            allStudents.length
        )
      : 0;

  const averageQuizScore =
    allStudents.length > 0
      ? Math.round(
          allStudents.reduce((sum, s) => sum + s.quizAverage, 0) /
            allStudents.length
        )
      : 0;

  const averageXp =
    allStudents.length > 0
      ? Math.round(
          allStudents.reduce((sum, s) => sum + s.xp, 0) / allStudents.length
        )
      : 0;

  const weeklyEngagementScore = Math.round(
    (activeUsers.size / cohortSize) * 100
  );

  return {
    currentWeek,
    targetWeek,
    pacePercent,
    overallCompletionRate,
    averageQuizScore,
    averageXp,
    weeklyEngagementScore,
    moduleCompletionRates,
    topStudents,
    bottomStudents,
    allStudents,
  };
}
