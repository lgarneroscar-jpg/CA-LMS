"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CADENCE_WEEKS } from "@/lib/reports";

const DRIP_TYPES = ["weekly", "async"] as const;
const CADENCES = Object.keys(CADENCE_WEEKS);

export type InstitutionFormInput = {
  name: string;
  cohort_start_date: string | null;
  reporting_cadence: string;
  drip_type: string;
  is_pilot: boolean;
  logo_url: string | null;
  primary_color: string | null;
  notes: string | null;
};

function parseForm(formData: FormData): InstitutionFormInput {
  const name = String(formData.get("name") ?? "").trim();
  const cohortRaw = String(formData.get("cohort_start_date") ?? "").trim();
  const reporting_cadence = String(
    formData.get("reporting_cadence") ?? "4weeks"
  ).trim();
  const drip_type = String(formData.get("drip_type") ?? "weekly").trim();
  const is_pilot = formData.get("is_pilot") === "true";
  const logo_url =
    String(formData.get("logo_url") ?? "").trim() || null;
  const primary_color =
    String(formData.get("primary_color") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) throw new Error("Name is required");
  if (!CADENCES.includes(reporting_cadence)) {
    throw new Error("Invalid reporting_cadence");
  }
  if (!DRIP_TYPES.includes(drip_type as (typeof DRIP_TYPES)[number])) {
    throw new Error("Invalid drip_type");
  }

  return {
    name,
    cohort_start_date: cohortRaw || null,
    reporting_cadence,
    drip_type,
    is_pilot,
    logo_url,
    primary_color,
    notes,
  };
}

export async function createInstitution(
  formData: FormData
): Promise<{ id: string }> {
  await requireRole(["super_admin"]);
  const input = parseForm(formData);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("institutions")
    .insert({
      name: input.name,
      cohort_start_date: input.cohort_start_date,
      reporting_cadence: input.reporting_cadence,
      drip_type: input.drip_type,
      is_pilot: input.is_pilot,
      logo_url: input.logo_url,
      primary_color: input.primary_color,
      notes: input.notes,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create institution");
  }

  revalidatePath("/superadmin");
  revalidatePath("/superadmin/institutions");
  return { id: data.id };
}

export async function updateInstitution(
  institutionId: string,
  formData: FormData
): Promise<{
  id: string;
  cohortStartChangedWithReports: boolean;
}> {
  await requireRole(["super_admin"]);
  if (!institutionId) throw new Error("Missing institution id");

  const input = parseForm(formData);
  const confirmCohortChange =
    formData.get("confirm_cohort_start_change") === "true";

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("institutions")
    .select("id, cohort_start_date")
    .eq("id", institutionId)
    .single();

  if (existingError || !existing) {
    throw new Error(existingError?.message ?? "Institution not found");
  }

  const cohortChanged =
    (existing.cohort_start_date ?? null) !== input.cohort_start_date;

  let reportCount = 0;
  if (cohortChanged) {
    const admin = createAdminClient();
    const { count, error: countError } = await admin
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("institution_id", institutionId);
    if (countError) throw new Error(countError.message);
    reportCount = count ?? 0;
  }

  if (cohortChanged && reportCount > 0 && !confirmCohortChange) {
    throw new Error(
      `COHORT_START_NEEDS_CONFIRM:${reportCount}:Changing cohort_start_date moves every future report period. This institution already has ${reportCount} report ${reportCount === 1 ? "snapshot" : "snapshots"}. Resubmit with confirmation.`
    );
  }

  const { error } = await supabase
    .from("institutions")
    .update({
      name: input.name,
      cohort_start_date: input.cohort_start_date,
      reporting_cadence: input.reporting_cadence,
      drip_type: input.drip_type,
      is_pilot: input.is_pilot,
      logo_url: input.logo_url,
      primary_color: input.primary_color,
      notes: input.notes,
    })
    .eq("id", institutionId);

  if (error) throw new Error(error.message);

  revalidatePath("/superadmin");
  revalidatePath("/superadmin/institutions");
  revalidatePath(`/superadmin/institutions/${institutionId}`);
  revalidatePath(`/superadmin/institutions/${institutionId}/reports`);
  revalidatePath(`/admin/${institutionId}/dashboard`);

  return {
    id: institutionId,
    cohortStartChangedWithReports: cohortChanged && reportCount > 0,
  };
}

export async function countInstitutionReports(
  institutionId: string
): Promise<number> {
  await requireRole(["super_admin"]);
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("institution_id", institutionId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
