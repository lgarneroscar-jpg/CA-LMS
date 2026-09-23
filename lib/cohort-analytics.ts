import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  buildAttentionReasons,
  compareStudentsForRoster,
  formatLiveAttendanceSummary,
} from "@/lib/admin-reporting";
import {
  fetchAuthInviteStatuses,
  invitePendingDays,
  INVITE_PENDING_ATTENTION_DAYS,
} from "@/lib/auth-invite-status";
import {
  formatCohortWeekLabel,
  getDisplayProgramWeek,
  getProgramWeek,
  PROGRAM_LENGTH_WEEKS,
} from "@/lib/drip";
import { getPaceStatus } from "@/lib/pace";
import { getProgressWeek, type ProgressModuleRef } from "@/lib/program";
import { compareCurriculumOrder } from "@/lib/program-nav";
import { videosTrackedInReporting } from "@/lib/module-content-status";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeModuleWorkbookBreakdown,
  computeStudentWorkbookMetrics,
  parseModuleExerciseCatalog,
  clampedQuizPercent,
  type ExerciseAnswerMetaRow,
  type ModuleWorkbookBreakdown,
} from "@/lib/workbook-activity";
import { isQuizPassingScore } from "@/lib/module-gates";
import type { AttentionReason } from "@/lib/admin-reporting";

type DbClient = SupabaseClient<Database>;

export type LiveSessionRef = {
  id: string;
  module_code: string;
  title: string;
  unlock_week: number;
};

export type AttendanceSource = "self_reported" | "admin_confirmed";

export type LiveSessionAttendanceRate = {
  sessionId: string;
  moduleCode: string;
  title: string;
  attendedCount: number;
  adminConfirmedCount: number;
  selfReportedCount: number;
  totalStudents: number;
  rate: number;
  summaryLabel: string;
};

export type DiagnosticIncompleteStudent = {
  id: string;
  full_name: string | null;
  daysSinceEnrollment: number;
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
  /** Quiz-passed modules as a percentage — used for pace math only. */
  completionPercent: number;
  modulesPassedCount: number;
  modulesPassedTotal: number;
  quizModulesPassed: number;
  videoModulesWatched: number;
  quizAverage: number;
  quizModulesTaken: number;
  /** Modules where the student has a quiz score but has not yet passed (≥75%). */
  quizBelowThresholdCount: number;
  isBehindPace: boolean;
  hasFlag: boolean;
  flagNote: string | null;
  liveAttendance: {
    attendedModuleIds: string[];
    attendedCount: number;
    total: number;
    adminConfirmedCount: number;
    selfReportedCount: number;
    summaryLabel: string;
  };
  workbookAnswered: number;
  workbookTotal: number;
  workbookPercent: number;
  lastWorkbookActivity: string | null;
  workbookModulesTouched: number;
  /** Days since invite with no sign-in; null once accepted or unknown. */
  invitePendingDays: number | null;
  attentionReasons: AttentionReason[];
};

export type CohortPhase = "pre_start" | "early" | "active" | "complete";

export type CohortAnalytics = {
  /** Raw calendar week from cohort start — may exceed program length. */
  currentWeek: number;
  /** Clamped to PROGRAM_LENGTH_WEEKS for labels. */
  displayWeek: number;
  /** True when currentWeek is past the program end. */
  programComplete: boolean;
  /** Label for "Cohort Week N" / "Week N of 12 · program complete". */
  cohortWeekLabel: string;
  /** pre_start | early (weeks 1–2) | active | complete */
  cohortPhase: CohortPhase;
  /** Days until cohort_start_date when phase is pre_start; otherwise 0. */
  daysUntilStart: number;
  targetWeek: number;
  pacePercent: number | null;
  /** Includes every student — a non-starter is genuinely 0% complete. Null when pre-start / no data yet. */
  overallCompletionRate: number | null;
  averageQuizScore: number | null;
  quizScoreStudentCount: number;
  averageWorkbookCompletionPercent: number | null;
  studentsWithZeroWorkbookActivity: number;
  averageXp: number | null;
  weeklyEngagementScore: number | null;
  moduleCompletionRates: {
    moduleId: string;
    moduleCode: string;
    title: string;
    unlockWeek: number;
    orderIndex: number;
    completionRate: number;
    completedCount: number;
    cohortSize: number;
    completedStudentIds: string[];
    incompleteStudentIds: string[];
  }[];
  liveSessions: LiveSessionRef[];
  liveSessionAttendanceRates: LiveSessionAttendanceRate[];
  videosTrackedInReporting: boolean;
  diagnostic: {
    completedCount: number;
    incompleteStudents: DiagnosticIncompleteStudent[];
  };
  topStudents: CohortStudentMetrics[];
  needsAttentionStudents: CohortStudentMetrics[];
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

export type GetCohortAnalyticsOptions = {
  /**
   * When true, exclude `is_demo` students from all totals.
   * Used for cross-institution rollups; leave false for single-institution
   * reporting (Demo University fixtures must remain visible there).
   */
  excludeDemo?: boolean;
};

export async function getCohortAnalytics(
  supabase: DbClient,
  institutionId: string,
  options: GetCohortAnalyticsOptions = {}
): Promise<CohortAnalytics | null> {
  const { excludeDemo = false } = options;
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

  let daysUntilStart = 0;
  let cohortPhase: CohortPhase = "active";
  if (!institution.cohort_start_date || currentWeek === 0) {
    cohortPhase = "pre_start";
    if (institution.cohort_start_date) {
      const start = new Date(institution.cohort_start_date + "T00:00:00");
      const today = new Date(new Date().toDateString());
      daysUntilStart = Math.max(
        0,
        Math.ceil((start.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
      );
    }
  } else if (programComplete) {
    cohortPhase = "complete";
  } else if (displayWeek <= 2) {
    cohortPhase = "early";
  }

  const cohortWeekLabel =
    cohortPhase === "pre_start"
      ? daysUntilStart > 0
        ? `Cohort starts in ${daysUntilStart} day${daysUntilStart === 1 ? "" : "s"} — no activity expected yet`
        : "Cohort has not started"
      : formatCohortWeekLabel(currentWeek);
  const targetWeek = Math.min(Math.max(1, currentWeek), PROGRAM_LENGTH_WEEKS);
  const suppressBehindPace =
    cohortPhase === "pre_start" || cohortPhase === "early";

  let studentsQuery = supabase
    .from("profiles")
    .select(
      "id, full_name, xp, rank, last_login, last_active_date, diagnostic_complete, program_started_at, created_at, is_demo"
    )
    .eq("institution_id", institutionId)
    .eq("role", "student");

  if (excludeDemo) {
    studentsQuery = studentsQuery.eq("is_demo", false);
  }

  const { data: students, error: studentsError } = await studentsQuery;

  if (studentsError) {
    failQuery("students", studentsError.message);
  }

  const studentIds = (students ?? []).map((s) => s.id);
  const cohortSize = studentIds.length || 1;
  const emptyStudentFilter = ["00000000-0000-0000-0000-000000000000"];

  const { data: modules, error: modulesError } = await supabase
    .from("modules")
    .select(
      "id, module_code, title, unlock_week, is_live_session, order_index, exercises, video_url"
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
    .select(
      "student_id, module_id, is_complete, quiz_score, quiz_completed, video_watched, attendance_source"
    )
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

  const authInviteStatuses = await fetchAuthInviteStatuses(studentIds);
  const emails = new Map<string, string>();
  for (const student of students ?? []) {
    emails.set(student.id, authInviteStatuses.get(student.id)?.email ?? "");
  }

  const totalModules = modules?.length ?? 0;
  const contentModuleIds = new Set((modules ?? []).map((m) => m.id));
  const liveSessionIds = liveSessions.map((s) => s.id);
  const videosTracked = videosTrackedInReporting(modules ?? []);
  const targetModules =
    modules?.filter((m) => m.unlock_week <= targetWeek) ?? [];
  const targetModuleIds = new Set(targetModules.map((m) => m.id));

  let paceCompletionSum = 0;
  let paceCompletionCount = 0;

  const moduleCompletionRates = [...(modules ?? [])]
    .sort(compareCurriculumOrder)
    .map((mod) => {
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
      unlockWeek: mod.unlock_week ?? 1,
      orderIndex: mod.order_index ?? 0,
      completionRate: rate,
      completedCount: completedStudentIds.length,
      cohortSize,
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
      const studentProgressRows = (progress ?? []).filter(
        (p) => p.student_id === student.id
      );
      const studentProgress = studentProgressRows.filter((p) => p.is_complete);
      const completedCount = studentProgress.filter((p) =>
        contentModuleIds.has(p.module_id)
      ).length;
      const completionPercent =
        totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

      const quizModulesPassed = studentProgressRows.filter(
        (p) => contentModuleIds.has(p.module_id) && p.quiz_completed
      ).length;
      const videoModulesWatched = studentProgressRows.filter(
        (p) => contentModuleIds.has(p.module_id) && p.video_watched
      ).length;

      const attendedModuleIds = liveSessionIds.filter((moduleId) =>
        studentProgress.some((p) => p.module_id === moduleId)
      );
      let adminConfirmedCount = 0;
      let selfReportedCount = 0;
      for (const moduleId of attendedModuleIds) {
        const row = studentProgressRows.find((p) => p.module_id === moduleId);
        if (row?.attendance_source === "admin_confirmed") {
          adminConfirmedCount += 1;
        } else if (row?.attendance_source === "self_reported") {
          selfReportedCount += 1;
        }
      }

      let quizSum = 0;
      let quizCount = 0;
      let quizBelowThresholdCount = 0;
      for (const row of studentProgressRows) {
        if (!contentModuleIds.has(row.module_id)) continue;
        const total = quizTotalByModule.get(row.module_id) ?? 0;
        if (total <= 0 || row.quiz_score == null) continue;
        quizSum += clampedQuizPercent(row.quiz_score, total) / 100;
        quizCount += 1;
        if (
          !row.quiz_completed &&
          !isQuizPassingScore(row.quiz_score, total)
        ) {
          quizBelowThresholdCount += 1;
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

      const authStatus = authInviteStatuses.get(student.id);
      const pendingDays = authStatus
        ? invitePendingDays(authStatus)
        : null;

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
        modulesPassedCount: completedCount,
        modulesPassedTotal: totalModules,
        quizModulesPassed,
        videoModulesWatched,
        quizAverage:
          quizCount > 0 ? Math.round((quizSum / quizCount) * 100) : 0,
        quizModulesTaken: quizCount,
        quizBelowThresholdCount,
        isBehindPace: suppressBehindPace
          ? false
          : isStudentBehindPace(
              student.program_started_at,
              progressWeek
            ),
        hasFlag: flagByStudent.has(student.id),
        flagNote: flagByStudent.get(student.id) ?? null,
        liveAttendance: {
          attendedModuleIds,
          attendedCount: attendedModuleIds.length,
          total: liveSessions.length,
          adminConfirmedCount,
          selfReportedCount,
          summaryLabel: formatLiveAttendanceSummary({
            attendedCount: attendedModuleIds.length,
            total: liveSessions.length,
            adminConfirmedCount,
            selfReportedCount,
            unit: "sessions",
          }),
        },
        workbookAnswered: workbook.workbookAnswered,
        workbookTotal: workbook.workbookTotal,
        workbookPercent: workbook.workbookPercent,
        lastWorkbookActivity: workbook.lastWorkbookActivity,
        workbookModulesTouched: workbook.workbookModulesTouched,
        invitePendingDays: pendingDays,
      };

      return {
        ...base,
        attentionReasons: buildAttentionReasons(
          base,
          new Date(),
          INVITE_PENDING_ATTENTION_DAYS
        ).filter((reason) => {
          if (suppressBehindPace && reason === "behind_pace") return false;
          if (cohortPhase === "early" && reason === "inactive") return false;
          // Invite never accepted is actionable even before cohort start.
          if (cohortPhase === "pre_start" && reason !== "invite_pending") {
            return false;
          }
          return true;
        }),
      };
    }
  );

  const allStudents = [...allStudentsUnsorted].sort(compareStudentsForRoster);

  const sortedByXp = [...allStudents].sort((a, b) => b.xp - a.xp);
  const topStudents = sortedByXp.slice(0, 10);
  const needsAttentionStudents =
    cohortPhase === "pre_start"
      ? allStudents
          .filter((s) => s.attentionReasons.includes("invite_pending"))
          .sort((a, b) => (b.invitePendingDays ?? 0) - (a.invitePendingDays ?? 0))
      : cohortPhase === "early"
        ? allStudents
            .filter((s) => s.attentionReasons.length > 0)
            .sort((a, b) => a.completionPercent - b.completionPercent)
        : allStudents
            .filter((s) => s.isBehindPace || s.attentionReasons.includes("invite_pending"))
            .sort((a, b) => a.completionPercent - b.completionPercent);

  const now = new Date();
  const diagnosticIncompleteStudents: DiagnosticIncompleteStudent[] = (
    students ?? []
  )
    .filter((student) => !student.diagnostic_complete)
    .map((student) => {
      const enrolledAt = student.program_started_at ?? student.created_at;
      const daysSinceEnrollment = enrolledAt
        ? Math.max(
            0,
            Math.floor(
              (now.getTime() - new Date(enrolledAt).getTime()) /
                (24 * 60 * 60 * 1000)
            )
          )
        : 0;
      return {
        id: student.id,
        full_name: student.full_name,
        daysSinceEnrollment,
      };
    })
    .sort((a, b) => b.daysSinceEnrollment - a.daysSinceEnrollment);

  const diagnostic = {
    completedCount: (students ?? []).filter((s) => s.diagnostic_complete).length,
    incompleteStudents: diagnosticIncompleteStudents,
  };

  // Deliberately includes non-starters at 0% when the cohort is underway —
  // unlike averageQuizScore below. Pre-start / empty cohorts return null ("no data yet").
  const anyModulePassed = allStudents.some((s) => s.modulesPassedCount > 0);
  const overallCompletionRate =
    cohortPhase === "pre_start" || allStudents.length === 0
      ? null
      : !anyModulePassed && cohortPhase === "early"
        ? null
        : Math.round(
            allStudents.reduce((sum, s) => sum + s.completionPercent, 0) /
              allStudents.length
          );

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

  const anyWorkbook = allStudents.some((s) => s.workbookAnswered > 0);
  const averageWorkbookCompletionPercent =
    cohortPhase === "pre_start" || allStudents.length === 0
      ? null
      : !anyWorkbook
        ? null
        : Math.round(
            allStudents.reduce((sum, s) => sum + s.workbookPercent, 0) /
              allStudents.length
          );

  const studentsWithZeroWorkbookActivity = allStudents.filter(
    (s) => s.workbookAnswered === 0
  ).length;

  const averageXp =
    cohortPhase === "pre_start" || allStudents.length === 0
      ? null
      : Math.round(
          allStudents.reduce((sum, s) => sum + s.xp, 0) / allStudents.length
        );

  const weeklyEngagementScore =
    cohortPhase === "pre_start"
      ? null
      : activeUsers.size === 0 && cohortPhase === "early"
        ? null
        : Math.round((activeUsers.size / cohortSize) * 100);

  const pacePercentValue =
    cohortPhase === "pre_start" || suppressBehindPace
      ? null
      : pacePercent;

  const liveSessionAttendanceRates: LiveSessionAttendanceRate[] =
    liveSessions.map((session) => {
      const sessionRows = (progress ?? []).filter(
        (row) => row.module_id === session.id && row.is_complete
      );
      const attendedCount = sessionRows.length;
      const adminConfirmedCount = sessionRows.filter(
        (row) => row.attendance_source === "admin_confirmed"
      ).length;
      const selfReportedCount = sessionRows.filter(
        (row) => row.attendance_source === "self_reported"
      ).length;

      return {
        sessionId: session.id,
        moduleCode: session.module_code,
        title: session.title,
        attendedCount,
        adminConfirmedCount,
        selfReportedCount,
        totalStudents: cohortSize,
        rate:
          cohortSize > 0
            ? Math.round((attendedCount / cohortSize) * 100)
            : 0,
        summaryLabel: formatLiveAttendanceSummary({
          attendedCount,
          total: cohortSize,
          adminConfirmedCount,
          selfReportedCount,
        }),
      };
    });

  return {
    currentWeek,
    displayWeek,
    programComplete,
    cohortWeekLabel,
    cohortPhase,
    daysUntilStart,
    targetWeek,
    pacePercent: pacePercentValue,
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
    videosTrackedInReporting: videosTracked,
    diagnostic,
    topStudents,
    needsAttentionStudents,
    allStudents,
  };
}
