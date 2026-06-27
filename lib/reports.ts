import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCohortAnalytics } from "@/lib/cohort-analytics";

type DbClient = SupabaseClient<Database>;

const CADENCE_WEEKS: Record<string, number> = {
  "2weeks": 2,
  "4weeks": 4,
  "6weeks": 6,
};

export async function maybeGenerateReportSnapshot(institutionId: string) {
  let supabase: DbClient;
  try {
    supabase = createAdminClient();
  } catch {
    return;
  }

  const { data: institution } = await supabase
    .from("institutions")
    .select("reporting_cadence, cohort_start_date")
    .eq("id", institutionId)
    .single();

  if (!institution?.cohort_start_date) return;

  const cadenceWeeks = CADENCE_WEEKS[institution.reporting_cadence] ?? 4;
  const cohortStart = new Date(institution.cohort_start_date + "T00:00:00");
  const today = new Date();
  const daysSinceStart = Math.floor(
    (today.getTime() - cohortStart.getTime()) / (24 * 60 * 60 * 1000)
  );
  if (daysSinceStart < cadenceWeeks * 7) return;

  const periodEnd = today.toISOString().slice(0, 10);
  const periodStartDate = new Date(today);
  periodStartDate.setDate(periodStartDate.getDate() - cadenceWeeks * 7);
  const periodStart = periodStartDate.toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("reports")
    .select("id")
    .eq("institution_id", institutionId)
    .eq("period_end", periodEnd)
    .maybeSingle();

  if (existing) return;

  const analytics = await getCohortAnalytics(supabase, institutionId);
  if (!analytics) return;

  await supabase.from("reports").insert({
    institution_id: institutionId,
    period_start: periodStart,
    period_end: periodEnd,
    snapshot: analytics as unknown as Database["public"]["Tables"]["reports"]["Insert"]["snapshot"],
  });
}
