import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  buildAttentionReasons,
  compareStudentsForRoster,
} from "@/lib/admin-reporting";
import {
  formatCohortWeekLabel,
  getDisplayProgramWeek,
  getProgramWeek,
  PROGRAM_LENGTH_WEEKS,
} from "@/lib/drip";
import { getPaceStatus } from "@/lib/pace";
import { getProgressWeek, type ProgressModuleRef } from "@/lib/program";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeModuleWorkbookBreakdown,
  computeStudentWorkbookMetrics,
  parseModuleExerciseCatalog,
  type ExerciseAnswerMetaRow,
  type ModuleWorkbookBreakdown,
} from "@/lib/workbook-activity";
import type { AttentionReason } from "@/lib/admin-reporting";

type DbClient = SupabaseClient<Database>;

export type LiveSessionRef = {
  id: string;
  module_code: string;
  title: string;
  unlock_week: number;
};

export type LiveSessionAttendanceRate = {
  sessionId: string;
  moduleCode: string;
  title: string;
  attendedCount: number;
  totalStudents: number;
  rate: number;
};

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
  quizModulesTaken: number;
  isBehindPace: boolean;
  hasFlag: boolean;
  flagNote: string | null;
  liveAttendance: {
    attendedModuleIds: string[];
    attendedCount: number;
    total: number;
  };
  workbookAnswered: number;
  workbookTotal: number;
  workbookPercent: number;
  lastWorkbookActivity: string | null;
  workbookModulesTouched: number;
  attentionReasons: AttentionReason[];
};

export type CohortAnalytics = {
  /** Raw calendar week from cohort start — may exceed program length. */
  currentWeek: number;
  /** Clamped to PROGRAM_LENGTH_WEEKS for labels. */
  displayWeek: number;
  /** True when currentWeek is past the program end. */
  programComplete: boolean;
  /** Label for "Cohort Week N" / "Week N of 12 · program complete". */
  cohortWeekLabel: string;
  targetWeek: number;
  pacePercent: number;
  /** Includes every student — a non-starter is genuinely 0% complete. */
  overallCompletionRate: number;
  averageQuizScore: number | null;
  quizScoreStudentCount: number;
  averageWorkbookCompletionPercent: number;
  studentsWithZeroWorkbookActivity: number;
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
  liveSessions: LiveSessionRef[];
  liveSessionAttendanceRates: LiveSessionAttendanceRate[];
  topStudents: CohortStudentMetrics[];
  bottomStudents: CohortStudentMetrics[];
  allStudents: CohortStudentMetrics[];
};

export function liveSessionExportHeader(session: LiveSessionRef): string {
  return `${session.module_code} ${session.title} (Wk ${session.unlock_week})`;
}

export function liveAttendanceLabel(attended: boolean): string {
  return attended ? "Attended" : "Not attended";
}

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

function failQuery(label: string, message: string): never {
  console.error(`[cohort-analytics] ${label}: ${message}`);
  throw new Error(`cohort-analytics ${label}: ${message}`);
}

/** Service role for exercise_answers — RLS only allows own/public rows. */
function getExerciseAnswersClient(fallback: DbClient): DbClient {
  try {
    return createAdminClient();
  } catch {
    return fallback;
  }
}

async function fetchExerciseAnswerMeta(
  supabase: DbClient,
  studentIds: string[],
  emptyStudentFilter: string[]
): Promise<ExerciseAnswerMetaRow[]> {
  const answersClient = getExerciseAnswersClient(supabase);
  const { data, error } = await answersClient
    .from("exercise_answers")
    .select("user_id, module_id, exercise_key, answer, updated_at")
    .in("user_id", studentIds.length ? studentIds : emptyStudentFilter);

  if (error) {
    failQuery("exercise_answers", error.message);
  }

  return (data ?? []) as ExerciseAnswerMetaRow[];
}

export async function getStudentModuleBreakdown(
  supabase: DbClient,
  institutionId: string,
  studentId: string
): Promise<ModuleWorkbookBreakdown[] | null> {
  const { data: student, error: studentError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", studentId)
    .eq("institution_id", institutionId)
    .eq("role", "student")
    .single();

  if (studentError) {
    failQuery("student profile", studentError.message);
  }
  if (!student) return null;

  const { data: modules, error: modulesError } = await supabase
    .from("modules")
    .select("id, module_code, title, is_live_session, exercises, unlock_week, order_index")
    .order("unlock_week")
    .order("order_index");

  if (modulesError) {
    failQuery("modules", modulesError.message);
  }

  const { data: progress, error: progressError } = await supabase
    .from("student_progress")
    .select("module_id, is_complete, quiz_score")
    .eq("student_id", studentId);

  if (progressError) {
    failQuery("student_progress", progressError.message);
  }

  const { data: quizCounts, error: quizCountsError } = await supabase
    .from("quiz_questions")
    .select("module_id");

  if (quizCountsError) {
    failQuery("quiz_questions", quizCountsError.message);
  }

  const quizTotalByModule = new Map<string, number>();
  (quizCounts ?? []).forEach((q) => {
    quizTotalByModule.set(
      q.module_id,
      (quizTotalByModule.get(q.module_id) ?? 0) + 1
    );
  });

  const contentModules = (modules ?? []).filter((m) => !m.is_live_session);
  const catalog = parseModuleExerciseCatalog(contentModules);
  const answers = await fetchExerciseAnswerMeta(supabase, [studentId], [
    studentId,
  ]);

  const progressByModule = new Map(
    (progress ?? []).map((row) => [
      row.module_id,
      {
        is_complete: row.is_complete,
        quiz_score: row.quiz_score,
      },
    ])
  );

  return computeModuleWorkbookBreakdown({
    modules: modules ?? [],
    catalog,
    answers,
    studentId,
    quizTotalByModule,
    progressByModule,
  });
}

export async function getCohortAnalytics(
  supabase: DbClient,
  institutionId: string
): Promise<CohortAnalytics | null> {
  const { data: institution, error: institutionError } = await supabase
    .from("institutions")
    .select("cohort_start_date")
    .eq("id", institutionId)
    .single();

  if (institutionError) {
    failQuery("institutions", institutionError.message);
  }
  if (!institution) return null;

  const currentWeek = getProgramWeek(institution.cohort_start_date);
  const displayWeek = getDisplayProgramWeek(currentWeek);
  const programComplete = currentWeek > PROGRAM_LENGTH_WEEKS;
  const cohortWeekLabel = formatCohortWeekLabel(currentWeek);
  const targetWeek = Math.min(Math.max(1, currentWeek), PROGRAM_LENGTH_WEEKS);

  const { data: students, error: studentsError } = await supabase
    .from("profiles")
    .select(
      "id, full_name, xp, rank, last_login, last_active_date, diagnostic_complete, program_started_at"
    )
    .eq("institution_id", institutionId)
    .eq("role", "student");

  if (studentsError) {
    failQuery("students", studentsError.message);
  }

  const studentIds = (students ?? []).map((s) => s.id);
  const cohortSize = studentIds.length || 1;
  const emptyStudentFilter = ["00000000-0000-0000-0000-000000000000"];

  const { data: modules, error: modulesError } = await supabase
    .from("modules")
    .select(
      "id, module_code, title, unlock_week, is_live_session, order_index, exercises"
    )
    .eq("is_live_session", false)
    .order("unlock_week")
    .order("order_index");

  if (modulesError) {
    failQuery("content modules", modulesError.message);
  }

  const { data: liveSessionRows, error: liveSessionsError } = await supabase
    .from("modules")
    .select("id, module_code, title, unlock_week, order_index")
    .eq("is_live_session", true)
    .order("unlock_week")
    .order("order_index");

  if (liveSessionsError) {
    failQuery("live sessions", liveSessionsError.message);
  }

  const liveSessions: LiveSessionRef[] = [...(liveSessionRows ?? [])]
    .sort(
      (a, b) =>
        (a.unlock_week ?? 1) - (b.unlock_week ?? 1) ||
        (a.order_index ?? 0) - (b.order_index ?? 0) ||
        a.module_code.localeCompare(b.module_code)
    )
    .map((row) => ({
      id: row.id,
      module_code: row.module_code,
      title: row.title,
      unlock_week: row.unlock_week ?? 1,
    }));

  const { data: progress, error: progressError } = await supabase
    .from("student_progress")
    .select("student_id, module_id, is_complete, quiz_score")
    .in("student_id", studentIds.length ? studentIds : emptyStudentFilter);

  if (progressError) {
    failQuery("student_progress", progressError.message);
  }

  const { data: quizCounts, error: quizCountsError } = await supabase
    .from("quiz_questions")
    .select("module_id");

  if (quizCountsError) {
    failQuery("quiz_questions", quizCountsError.message);
  }

  const quizTotalByModule = new Map<string, number>();
  (quizCounts ?? []).forEach((q) => {
    quizTotalByModule.set(
      q.module_id,
      (quizTotalByModule.get(q.module_id) ?? 0) + 1
    );
  });

  const { data: flags, error: flagsError } = await supabase
    .from("flags")
    .select("student_id, note")
    .in("student_id", studentIds.length ? studentIds : emptyStudentFilter);

  if (flagsError) {
    failQuery("flags", flagsError.message);
  }

  const flagByStudent = new Map(
    (flags ?? []).map((f) => [f.student_id, f.note])
  );

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentLogins, error: recentLoginsError } = await supabase
    .from("login_events")
    .select("user_id")
    .in("user_id", studentIds.length ? studentIds : emptyStudentFilter)
    .gte("logged_in_at", sevenDaysAgo);

  if (recentLoginsError) {
    failQuery("login_events", recentLoginsError.message);
  }

  const activeUsers = new Set((recentLogins ?? []).map((l) => l.user_id));

  const exerciseCatalog = parseModuleExerciseCatalog(modules ?? []);
  const exerciseAnswers = await fetchExerciseAnswerMeta(
    supabase,
    studentIds,
    emptyStudentFilter
  );

  const emails = new Map<string, string>();
  for (const student of students ?? []) {
    emails.set(student.id, "");
  }

  const totalModules = modules?.length ?? 0;
  const contentModuleIds = new Set((modules ?? []).map((m) => m.id));
  const liveSessionIds = liveSessions.map((s) => s.id);
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

  const allStudentsUnsorted: CohortStudentMetrics[] = (students ?? []).map(
    (student) => {
      const studentProgress = (progress ?? []).filter(
        (p) => p.student_id === student.id && p.is_complete
      );
      const completedCount = studentProgress.filter((p) =>
        contentModuleIds.has(p.module_id)
      ).length;
      const completionPercent =
        totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
      const attendedModuleIds = liveSessionIds.filter((moduleId) =>
        studentProgress.some((p) => p.module_id === moduleId)
      );

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

      const workbook = computeStudentWorkbookMetrics(
        student.id,
        exerciseCatalog,
        exerciseAnswers
      );

      const base: Omit<CohortStudentMetrics, "attentionReasons"> = {
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
        quizModulesTaken: quizCount,
        isBehindPace: isStudentBehindPace(
          student.program_started_at,
          progressWeek
        ),
        hasFlag: flagByStudent.has(student.id),
        flagNote: flagByStudent.get(student.id) ?? null,
        liveAttendance: {
          attendedModuleIds,
          attendedCount: attendedModuleIds.length,
          total: liveSessions.length,
        },
        workbookAnswered: workbook.workbookAnswered,
        workbookTotal: workbook.workbookTotal,
        workbookPercent: workbook.workbookPercent,
        lastWorkbookActivity: workbook.lastWorkbookActivity,
        workbookModulesTouched: workbook.workbookModulesTouched,
      };

      return {
        ...base,
        attentionReasons: buildAttentionReasons(base),
      };
    }
  );

  const allStudents = [...allStudentsUnsorted].sort(compareStudentsForRoster);

  const sortedByXp = [...allStudents].sort((a, b) => b.xp - a.xp);
  const topStudents = sortedByXp.slice(0, 10);
  const bottomStudents = allStudents
    .filter((s) => s.isBehindPace)
    .sort((a, b) => a.completionPercent - b.completionPercent)
    .slice(0, 5);

  // Deliberately includes non-starters at 0% — unlike averageQuizScore below.
  const overallCompletionRate =
    allStudents.length > 0
      ? Math.round(
          allStudents.reduce((sum, s) => sum + s.completionPercent, 0) /
            allStudents.length
        )
      : 0;

  const studentsWithQuizScores = allStudents.filter(
    (s) => s.quizModulesTaken > 0
  );
  const averageQuizScore =
    studentsWithQuizScores.length > 0
      ? Math.round(
          studentsWithQuizScores.reduce((sum, s) => sum + s.quizAverage, 0) /
            studentsWithQuizScores.length
        )
      : null;

  const averageWorkbookCompletionPercent =
    allStudents.length > 0
      ? Math.round(
          allStudents.reduce((sum, s) => sum + s.workbookPercent, 0) /
            allStudents.length
        )
      : 0;

  const studentsWithZeroWorkbookActivity = allStudents.filter(
    (s) => s.workbookAnswered === 0
  ).length;

  const averageXp =
    allStudents.length > 0
      ? Math.round(
          allStudents.reduce((sum, s) => sum + s.xp, 0) / allStudents.length
        )
      : 0;

  const weeklyEngagementScore = Math.round(
    (activeUsers.size / cohortSize) * 100
  );

  const liveSessionAttendanceRates: LiveSessionAttendanceRate[] =
    liveSessions.map((session) => {
      const attendedCount = (students ?? []).filter((student) =>
        (progress ?? []).some(
          (row) =>
            row.student_id === student.id &&
            row.module_id === session.id &&
            row.is_complete
        )
      ).length;

      return {
        sessionId: session.id,
        moduleCode: session.module_code,
        title: session.title,
        attendedCount,
        totalStudents: cohortSize,
        rate:
          cohortSize > 0
            ? Math.round((attendedCount / cohortSize) * 100)
            : 0,
      };
    });

  return {
    currentWeek,
    displayWeek,
    programComplete,
    cohortWeekLabel,
    targetWeek,
    pacePercent,
    overallCompletionRate,
    averageQuizScore,
    quizScoreStudentCount: studentsWithQuizScores.length,
    averageWorkbookCompletionPercent,
    studentsWithZeroWorkbookActivity,
    averageXp,
    weeklyEngagementScore,
    moduleCompletionRates,
    liveSessions,
    liveSessionAttendanceRates,
    topStudents,
    bottomStudents,
    allStudents,
  };
}
