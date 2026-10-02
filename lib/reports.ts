import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCohortAnalytics,
  type CohortAnalytics,
} from "@/lib/cohort-analytics";
import { COMPLETION_DEFINITION_VERSION } from "@/lib/module-gates";

type DbClient = SupabaseClient<Database>;

export const SNAPSHOT_VERSION = 1;

export const CADENCE_WEEKS: Record<string, number> = {
  "2weeks": 2,
  "4weeks": 4,
  "6weeks": 6,
};

export type ReportGeneratedBy = "cron" | "manual";

/** Versioned envelope stored in reports.snapshot. */
export type ReportSnapshotEnvelope = {
  snapshotVersion: typeof SNAPSHOT_VERSION;
  completionDefinition: string;
  generatedAt: string;
  generatedBy: ReportGeneratedBy;
  cohortSize: number;
  metrics: CohortAnalytics;
};

export type ReportPeriod = {
  periodIndex: number;
  periodStart: string;
  periodEnd: string;
  cadenceWeeks: number;
};

export type GenerateSnapshotResult =
  | {
      status: "created" | "already_exists" | "updated";
      institutionId: string;
      period: ReportPeriod;
      reportId?: string;
    }
  | {
      status: "skipped";
      institutionId: string;
      reason: string;
    }
  | {
      status: "error";
      institutionId: string;
      error: string;
    };

function fail(context: string, message: string): never {
  console.error(`[reports] ${context}: ${message}`);
  throw new Error(`${context}: ${message}`);
}

function requireAdminClient(): DbClient {
  try {
    return createAdminClient();
  } catch (err) {
    fail(
      "admin-client",
      err instanceof Error ? err.message : "SUPABASE_SERVICE_ROLE_KEY unavailable"
    );
  }
}

/** YYYY-MM-DD from a local calendar Date (no TZ shift). */
export function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateOnly(isoDate: string): Date {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${isoDate}`);
  }
  return date;
}

export function addDays(isoDate: string, days: number): string {
  const date = parseDateOnly(isoDate);
  date.setDate(date.getDate() + days);
  return formatDateOnly(date);
}

export function cadenceWeeksFrom(reportingCadence: string | null | undefined): number {
  return CADENCE_WEEKS[reportingCadence ?? ""] ?? 4;
}

/**
 * Period N boundaries from cohort_start_date + N × cadenceWeeks.
 * periodStart = start + (N-1)×cadenceDays
 * periodEnd   = start + N×cadenceDays
 * Generation is due when today >= periodEnd (period fully elapsed).
 */
export function getReportPeriod(
  cohortStartDate: string,
  cadenceWeeks: number,
  periodIndex: number
): ReportPeriod {
  if (periodIndex < 1) {
    throw new Error(`periodIndex must be >= 1, got ${periodIndex}`);
  }
  const cadenceDays = cadenceWeeks * 7;
  return {
    periodIndex,
    periodStart: addDays(cohortStartDate, (periodIndex - 1) * cadenceDays),
    periodEnd: addDays(cohortStartDate, periodIndex * cadenceDays),
    cadenceWeeks,
  };
}

/** Highest period index whose periodEnd is on or before today. */
export function latestDuePeriodIndex(
  cohortStartDate: string,
  cadenceWeeks: number,
  today: Date = new Date()
): number {
  const todayStr = formatDateOnly(today);
  const start = parseDateOnly(cohortStartDate);
  if (todayStr < formatDateOnly(start)) return 0;

  const cadenceDays = cadenceWeeks * 7;
  const daysSinceStart = Math.floor(
    (parseDateOnly(todayStr).getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
  );
  return Math.floor(daysSinceStart / cadenceDays);
}

export function listDuePeriods(
  cohortStartDate: string,
  cadenceWeeks: number,
  today: Date = new Date()
): ReportPeriod[] {
  const latest = latestDuePeriodIndex(cohortStartDate, cadenceWeeks, today);
  const periods: ReportPeriod[] = [];
  for (let n = 1; n <= latest; n += 1) {
    periods.push(getReportPeriod(cohortStartDate, cadenceWeeks, n));
  }
  return periods;
}

export function parseSnapshotEnvelope(
  raw: unknown
): ReportSnapshotEnvelope | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  // Legacy bare analytics (pre-S2) — treat as unversioned with unknown definition.
  if (!("snapshotVersion" in obj) && "overallCompletionRate" in obj) {
    return {
      snapshotVersion: SNAPSHOT_VERSION,
      completionDefinition: "unknown-legacy",
      generatedAt: "",
      generatedBy: "manual",
      cohortSize: Array.isArray((obj as { allStudents?: unknown }).allStudents)
        ? ((obj as { allStudents: unknown[] }).allStudents.length)
        : 0,
      metrics: obj as unknown as CohortAnalytics,
    };
  }

  if (obj.snapshotVersion !== SNAPSHOT_VERSION) return null;
  if (typeof obj.completionDefinition !== "string") return null;
  if (typeof obj.generatedAt !== "string") return null;
  if (obj.generatedBy !== "cron" && obj.generatedBy !== "manual") return null;
  if (typeof obj.cohortSize !== "number") return null;
  if (!obj.metrics || typeof obj.metrics !== "object") return null;

  return obj as unknown as ReportSnapshotEnvelope;
}

function buildEnvelope(
  analytics: CohortAnalytics,
  generatedBy: ReportGeneratedBy
): ReportSnapshotEnvelope {
  // Store clamped display fields; keep currentWeek for audit but reports use displayWeek.
  const metrics: CohortAnalytics = {
    ...analytics,
    currentWeek: analytics.displayWeek,
  };

  return {
    snapshotVersion: SNAPSHOT_VERSION,
    completionDefinition: COMPLETION_DEFINITION_VERSION,
    generatedAt: new Date().toISOString(),
    generatedBy,
    cohortSize: analytics.allStudents.length,
    metrics,
  };
}

export type PendingReportPreview = {
  institutionId: string;
  institutionName: string;
  cadenceWeeks: number;
  period: ReportPeriod | null;
  alreadyExists: boolean;
  message: string;
};

export async function previewNextReportPeriod(
  institutionId: string
): Promise<PendingReportPreview> {
  const supabase = requireAdminClient();

  const { data: institution, error } = await supabase
    .from("institutions")
    .select("id, name, reporting_cadence, cohort_start_date")
    .eq("id", institutionId)
    .single();

  if (error) fail("preview-institution", error.message);
  if (!institution) fail("preview-institution", "Institution not found");
  if (!institution.cohort_start_date) {
    return {
      institutionId,
      institutionName: institution.name,
      cadenceWeeks: cadenceWeeksFrom(institution.reporting_cadence),
      period: null,
      alreadyExists: false,
      message: "No cohort start date — cannot compute report periods.",
    };
  }

  const cadenceWeeks = cadenceWeeksFrom(institution.reporting_cadence);
  const due = listDuePeriods(institution.cohort_start_date, cadenceWeeks);
  if (due.length === 0) {
    const daysUntil = Math.ceil(
      (parseDateOnly(
        getReportPeriod(institution.cohort_start_date, cadenceWeeks, 1).periodEnd
      ).getTime() -
        parseDateOnly(formatDateOnly(new Date())).getTime()) /
        (24 * 60 * 60 * 1000)
    );
    return {
      institutionId,
      institutionName: institution.name,
      cadenceWeeks,
      period: null,
      alreadyExists: false,
      message:
        daysUntil > 0
          ? `First reporting period ends in ${daysUntil} ${daysUntil === 1 ? "day" : "days"}. Nothing to generate yet.`
          : "No reporting period is due yet.",
    };
  }

  const existingEnds = new Set<string>();
  const { data: existing, error: existingError } = await supabase
    .from("reports")
    .select("period_end")
    .eq("institution_id", institutionId);
  if (existingError) fail("preview-existing", existingError.message);
  for (const row of existing ?? []) existingEnds.add(row.period_end);

  const missing = due.filter((p) => !existingEnds.has(p.periodEnd));
  const target = missing.length > 0 ? missing[missing.length - 1] : due[due.length - 1];
  const alreadyExists = existingEnds.has(target.periodEnd);

  return {
    institutionId,
    institutionName: institution.name,
    cadenceWeeks,
    period: target,
    alreadyExists,
    message: alreadyExists
      ? `Period ${target.periodIndex} (${target.periodStart} → ${target.periodEnd}) already has a snapshot. Confirming will regenerate it in place.`
      : `Will create a snapshot for period ${target.periodIndex}: ${target.periodStart} → ${target.periodEnd} (${cadenceWeeks}-week cadence).`,
  };
}

export async function generateReportSnapshot(params: {
  institutionId: string;
  generatedBy: ReportGeneratedBy;
  /** When set, generate this period even if not the latest due. */
  periodIndex?: number;
  /** Overwrite existing row for the same period_end. */
  regenerate?: boolean;
}): Promise<GenerateSnapshotResult> {
  const { institutionId, generatedBy, regenerate = false } = params;
  const supabase = requireAdminClient();

  const { data: institution, error: institutionError } = await supabase
    .from("institutions")
    .select("id, reporting_cadence, cohort_start_date")
    .eq("id", institutionId)
    .single();

  if (institutionError) {
    return {
      status: "error",
      institutionId,
      error: `institution lookup: ${institutionError.message}`,
    };
  }
  if (!institution) {
    return { status: "error", institutionId, error: "Institution not found" };
  }
  if (!institution.cohort_start_date) {
    return {
      status: "skipped",
      institutionId,
      reason: "No cohort_start_date",
    };
  }

  const cadenceWeeks = cadenceWeeksFrom(institution.reporting_cadence);
  const dueIndex = latestDuePeriodIndex(
    institution.cohort_start_date,
    cadenceWeeks
  );

  if (dueIndex < 1 && params.periodIndex == null) {
    return {
      status: "skipped",
      institutionId,
      reason: "No reporting period is due yet",
    };
  }

  const periodIndex = params.periodIndex ?? dueIndex;
  if (periodIndex > dueIndex) {
    return {
      status: "skipped",
      institutionId,
      reason: `Period ${periodIndex} is not due yet (latest due is ${dueIndex})`,
    };
  }

  const period = getReportPeriod(
    institution.cohort_start_date,
    cadenceWeeks,
    periodIndex
  );

  let analytics: CohortAnalytics | null;
  try {
    analytics = await getCohortAnalytics(supabase, institutionId);
  } catch (err) {
    return {
      status: "error",
      institutionId,
      error: err instanceof Error ? err.message : "getCohortAnalytics failed",
    };
  }
  if (!analytics) {
    return {
      status: "error",
      institutionId,
      error: "getCohortAnalytics returned null",
    };
  }

  const envelope = buildEnvelope(analytics, generatedBy);
  const snapshotJson = envelope as unknown as Json;

  const { data: existing, error: existingError } = await supabase
    .from("reports")
    .select("id")
    .eq("institution_id", institutionId)
    .eq("period_end", period.periodEnd)
    .maybeSingle();

  if (existingError) {
    return {
      status: "error",
      institutionId,
      error: `existing check: ${existingError.message}`,
    };
  }

  if (existing && !regenerate) {
    return {
      status: "already_exists",
      institutionId,
      period,
      reportId: existing.id,
    };
  }

  if (existing && regenerate) {
    const { error: updateError } = await supabase
      .from("reports")
      .update({
        period_start: period.periodStart,
        period_end: period.periodEnd,
        snapshot: snapshotJson,
      })
      .eq("id", existing.id);

    if (updateError) {
      return {
        status: "error",
        institutionId,
        error: `update: ${updateError.message}`,
      };
    }

    return {
      status: "updated",
      institutionId,
      period,
      reportId: existing.id,
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("reports")
    .insert({
      institution_id: institutionId,
      period_start: period.periodStart,
      period_end: period.periodEnd,
      snapshot: snapshotJson,
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    // Unique index race — treat as already exists.
    if (insertError.code === "23505") {
      return {
        status: "already_exists",
        institutionId,
        period,
      };
    }
    return {
      status: "error",
      institutionId,
      error: `insert: ${insertError.message}`,
    };
  }

  return {
    status: "created",
    institutionId,
    period,
    reportId: inserted?.id,
  };
}

/** Cron: create any missing due periods for every institution. */
export async function generateDueSnapshotsForAllInstitutions(
  generatedBy: ReportGeneratedBy = "cron"
): Promise<GenerateSnapshotResult[]> {
  const supabase = requireAdminClient();
  const { data: institutions, error } = await supabase
    .from("institutions")
    .select("id, cohort_start_date, reporting_cadence");

  if (error) fail("list-institutions", error.message);

  const results: GenerateSnapshotResult[] = [];

  for (const institution of institutions ?? []) {
    if (!institution.cohort_start_date) {
      results.push({
        status: "skipped",
        institutionId: institution.id,
        reason: "No cohort_start_date",
      });
      continue;
    }

    const cadenceWeeks = cadenceWeeksFrom(institution.reporting_cadence);
    const due = listDuePeriods(institution.cohort_start_date, cadenceWeeks);

    const { data: existing, error: existingError } = await supabase
      .from("reports")
      .select("period_end")
      .eq("institution_id", institution.id);

    if (existingError) {
      results.push({
        status: "error",
        institutionId: institution.id,
        error: existingError.message,
      });
      continue;
    }

    const have = new Set((existing ?? []).map((r) => r.period_end));
    const missing = due.filter((p) => !have.has(p.periodEnd));

    if (missing.length === 0) {
      results.push({
        status: "skipped",
        institutionId: institution.id,
        reason:
          due.length === 0
            ? "No period due yet"
            : "All due periods already snapshotted",
      });
      continue;
    }

    for (const period of missing) {
      results.push(
        await generateReportSnapshot({
          institutionId: institution.id,
          generatedBy,
          periodIndex: period.periodIndex,
          regenerate: false,
        })
      );
    }
  }

  return results;
}

export async function loadReportRow(
  institutionId: string,
  reportId: string
): Promise<{
  id: string;
  period_start: string;
  period_end: string;
  created_at: string;
  envelope: ReportSnapshotEnvelope;
} | null> {
  const supabase = requireAdminClient();
  const { data, error } = await supabase
    .from("reports")
    .select("id, period_start, period_end, created_at, snapshot")
    .eq("institution_id", institutionId)
    .eq("id", reportId)
    .maybeSingle();

  if (error) fail("load-report", error.message);
  if (!data) return null;

  const envelope = parseSnapshotEnvelope(data.snapshot);
  if (!envelope) fail("load-report", "Snapshot envelope could not be parsed");

  return {
    id: data.id,
    period_start: data.period_start,
    period_end: data.period_end,
    created_at: data.created_at,
    envelope,
  };
}

export async function loadPreviousReport(
  institutionId: string,
  periodEnd: string
): Promise<{
  id: string;
  period_start: string;
  period_end: string;
  envelope: ReportSnapshotEnvelope;
} | null> {
  const supabase = requireAdminClient();
  const { data, error } = await supabase
    .from("reports")
    .select("id, period_start, period_end, snapshot")
    .eq("institution_id", institutionId)
    .lt("period_end", periodEnd)
    .order("period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) fail("load-previous-report", error.message);
  if (!data) return null;

  const envelope = parseSnapshotEnvelope(data.snapshot);
  if (!envelope) return null;

  return {
    id: data.id,
    period_start: data.period_start,
    period_end: data.period_end,
    envelope,
  };
}
