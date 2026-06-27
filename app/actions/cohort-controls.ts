"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export async function updateCohortStartDate(formData: FormData) {
  await requireRole(["super_admin"]);

  const institutionId = String(formData.get("institutionId") ?? "");
  const cohortStartDate = String(formData.get("cohortStartDate") ?? "");

  if (!institutionId) throw new Error("Missing institutionId");

  // Empty string means clear date
  const dateValue = cohortStartDate ? cohortStartDate : null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("institutions")
    .update({ cohort_start_date: dateValue })
    .eq("id", institutionId);

  if (error) throw new Error(error.message);

  revalidatePath("/superadmin");
}

export async function setInstitutionFullyUnlocked(formData: FormData) {
  await requireRole(["super_admin"]);

  const institutionId = String(formData.get("institutionId") ?? "");
  const isFullyUnlocked = formData.get("isFullyUnlocked") === "true";

  if (!institutionId) throw new Error("Missing institutionId");

  const supabase = await createClient();
  const { error } = await supabase
    .from("institutions")
    .update({ is_fully_unlocked: isFullyUnlocked })
    .eq("id", institutionId);

  if (error) throw new Error(error.message);

  revalidatePath("/superadmin");
}

export async function unlockInstitutionWeek(formData: FormData) {
  await requireRole(["super_admin"]);

  const institutionId = String(formData.get("institutionId") ?? "");
  const weekNumber = Number(formData.get("weekNumber") ?? "");

  if (!institutionId) throw new Error("Missing institutionId");
  if (!Number.isFinite(weekNumber) || weekNumber < 1)
    throw new Error("Invalid weekNumber");

  const supabase = await createClient();

  const { error } = await supabase.from("institution_unlocked_weeks").upsert(
    {
      institution_id: institutionId,
      week_number: weekNumber,
    },
    { onConflict: "institution_id,week_number" }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/superadmin");
}

