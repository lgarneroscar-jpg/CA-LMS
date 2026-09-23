import { createClient } from "@/lib/supabase/server";
import { getCohortAnalytics } from "@/lib/cohort-analytics";
import { createAdminClient } from "@/lib/supabase/admin";

export type InstitutionOverviewRow = {
  id: string;
  name: string;
  is_pilot: boolean;
  cohort_start_date: string | null;
  reporting_cadence: string;
  drip_type: string;
  cohortSize: number;
  displayWeek: number | null;
  cohortWeekLabel: string;
  modulesPassedAverage: number | null;
  /** Progress against what was expected by now — the pace-adjusted figure. */
  keepingPaceAverage: number | null;
  workbookAverage: number | null;
  needingAttention: number;
  lastReportAt: string | null;
};

/**
 * Cross-institution rollup for /superadmin.
 * Excludes is_demo students from all totals (S1.5 rule).
 */
export async function getCrossInstitutionOverview(): Promise<
  InstitutionOverviewRow[]
> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: institutions, error } = await supabase
    .from("institutions")
    .select(
      "id, name, is_pilot, cohort_start_date, reporting_cadence, drip_type"
    )
    .order("name");

  if (error) throw new Error(error.message);
  if (!institutions?.length) return [];

  const { data: reports, error: reportsError } = await admin
    .from("reports")
    .select("institution_id, created_at")
    .order("created_at", { ascending: false });

  if (reportsError) throw new Error(reportsError.message);

  const lastReportByInstitution = new Map<string, string>();
  for (const report of reports ?? []) {
    if (!lastReportByInstitution.has(report.institution_id)) {
      lastReportByInstitution.set(report.institution_id, report.created_at);
    }
  }

  const rows: InstitutionOverviewRow[] = [];

  for (const inst of institutions) {
    const analytics = await getCohortAnalytics(supabase, inst.id, {
      excludeDemo: true,
    });

    rows.push({
      id: inst.id,
      name: inst.name,
      is_pilot: inst.is_pilot,
      cohort_start_date: inst.cohort_start_date,
      reporting_cadence: inst.reporting_cadence,
      drip_type: inst.drip_type,
      cohortSize: analytics?.allStudents.length ?? 0,
      displayWeek: analytics?.displayWeek ?? null,
      cohortWeekLabel: analytics?.cohortWeekLabel ?? "—",
      modulesPassedAverage: analytics?.overallCompletionRate ?? null,
      keepingPaceAverage: analytics?.paceCompletionRate ?? null,
      workbookAverage: analytics?.averageWorkbookCompletionPercent ?? null,
      needingAttention: analytics?.needsAttentionStudents.length ?? 0,
      lastReportAt: lastReportByInstitution.get(inst.id) ?? null,
    });
  }

  return rows;
}
