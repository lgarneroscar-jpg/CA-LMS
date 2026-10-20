import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { fetchStudentReadinessDirections } from "@/lib/capri/queries";
import {
  PILLAR_NAMES,
  type CapriPillar,
  type ReadinessDirection,
} from "@/lib/capri/scoring";
import { PROGRAM_LENGTH_WEEKS } from "@/lib/drip";
import {
  fetchWorkbookPortfolio,
  type WorkbookPortfolioPillar,
} from "@/lib/profile-workbook";
import { CONTENT_MODULE_COUNT } from "@/lib/program-completion";
import {
  parsePortfolioSelection,
  portfolioSelectionKey,
} from "@/lib/portfolio-selection";

type DbClient = SupabaseClient<Database>;

export const PORTFOLIO_COMPLETION_DEFINITION =
  "A module is complete when every workbook exercise in it has been answered and its quiz has been passed at 75% or above.";

/**
 * Seeded preview-institution fixture (scripts/seed-demo-cohort.ts) that has
 * finished the program. Shown read-only to preview users as a finished
 * example. Pinned by id rather than "any demo profile with a completion date":
 * a real prospect who finishes inside the preview institution must never have
 * their writing shown to other prospects.
 */
export const PORTFOLIO_EXAMPLE_STUDENT_ID = "dee00000-0000-4000-a000-000000000001";

/** Who may open the portfolio builder and document for their own work. */
export function canOpenOwnPortfolio(profile: {
  program_completed_at: string | null;
  is_demo: boolean;
}): boolean {
  return Boolean(profile.program_completed_at) || profile.is_demo;
}

export type PortfolioReadinessLine = {
  pillar: CapriPillar;
  pillarName: string;
  direction: ReadinessDirection;
};

export type PortfolioDocumentData = {
  studentName: string;
  institutionName: string | null;
  cohortStart: string | null;
  cohortEnd: string | null;
  /** Null for a preview built before the program is finished. */
  completedAt: string | null;
  modulesCompleted: number;
  modulesTotal: number;
  liveSessions: {
    total: number;
    attended: number;
    adminConfirmed: number;
    selfReported: number;
  };
  /** Null when there is no paired baseline + post — the section is then omitted. */
  readiness: PortfolioReadinessLine[] | null;
  selectedWork: WorkbookPortfolioPillar[];
};

/** Keeps only the ticked exercises, dropping modules and pillars left empty. */
export function filterPortfolioSelection(
  pillars: WorkbookPortfolioPillar[],
  selection: string[]
): WorkbookPortfolioPillar[] {
  const selected = new Set(selection);
  return pillars
    .map((pillar) => ({
      ...pillar,
      modules: pillar.modules
        .map((module) => ({
          ...module,
          exercises: module.exercises.filter((exercise) =>
            selected.has(portfolioSelectionKey(exercise.moduleId, exercise.exerciseKey))
          ),
        }))
        .filter((module) => module.exercises.length > 0),
    }))
    .filter((pillar) => pillar.modules.length > 0);
}

function addDaysIso(isoDate: string, days: number): string {
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Everything the printable document shows, for the signed-in student only
 * (or the pinned example, via the service role). Caller is responsible for
 * the access gate. `includeAllWork` ignores the selection.
 */
export async function loadPortfolioDocument(
  supabase: DbClient,
  student: {
    id: string;
    full_name: string | null;
    institution_id: string | null;
    program_completed_at: string | null;
    portfolio_selection?: unknown;
  },
  options: { includeAllWork?: boolean } = {}
): Promise<PortfolioDocumentData> {
  const [
    workbook,
    readinessDirections,
    { data: modules },
    { data: progress },
    { data: institution },
  ] = await Promise.all([
    fetchWorkbookPortfolio(supabase, student.id),
    fetchStudentReadinessDirections(supabase, student.id),
    supabase.from("modules").select("id, is_live_session"),
    supabase
      .from("student_progress")
      .select("module_id, is_complete, attendance_source")
      .eq("student_id", student.id)
      .eq("is_complete", true),
    student.institution_id
      ? supabase
          .from("institutions")
          .select("name, cohort_start_date")
          .eq("id", student.institution_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const liveIds = new Set(
    (modules ?? []).filter((m) => m.is_live_session).map((m) => m.id)
  );
  const contentIds = new Set(
    (modules ?? []).filter((m) => !m.is_live_session).map((m) => m.id)
  );
  const completeRows = progress ?? [];
  const liveRows = completeRows.filter((row) => liveIds.has(row.module_id));

  const cohortStart = institution?.cohort_start_date ?? null;

  return {
    studentName: student.full_name?.trim() || "Student",
    institutionName: institution?.name ?? null,
    cohortStart,
    cohortEnd: cohortStart ? addDaysIso(cohortStart, PROGRAM_LENGTH_WEEKS * 7 - 1) : null,
    completedAt: student.program_completed_at,
    modulesCompleted: Math.min(
      completeRows.filter((row) => contentIds.has(row.module_id)).length,
      CONTENT_MODULE_COUNT
    ),
    modulesTotal: CONTENT_MODULE_COUNT,
    liveSessions: {
      total: liveIds.size,
      attended: liveRows.length,
      adminConfirmed: liveRows.filter((r) => r.attendance_source === "admin_confirmed").length,
      selfReported: liveRows.filter((r) => r.attendance_source === "self_reported").length,
    },
    readiness: readinessDirections
      ? ([1, 2, 3] as CapriPillar[]).map((pillar) => ({
          pillar,
          pillarName: PILLAR_NAMES[pillar],
          direction: readinessDirections[pillar],
        }))
      : null,
    selectedWork: options.includeAllWork
      ? workbook
      : filterPortfolioSelection(
          workbook,
          parsePortfolioSelection(student.portfolio_selection)
        ),
  };
}
