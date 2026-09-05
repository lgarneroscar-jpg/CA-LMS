"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import {
  generateReportSnapshot,
  previewNextReportPeriod,
  type GenerateSnapshotResult,
  type PendingReportPreview,
} from "@/lib/reports";

async function assertCanGenerate(institutionId: string) {
  const profile = await requireRole(["institutional_admin", "super_admin"]);
  if (
    profile.role === "institutional_admin" &&
    profile.institution_id !== institutionId
  ) {
    throw new Error("Forbidden");
  }
  return profile;
}

export async function previewReportGeneration(
  institutionId: string
): Promise<PendingReportPreview> {
  await assertCanGenerate(institutionId);
  return previewNextReportPeriod(institutionId);
}

export async function confirmGenerateReport(
  institutionId: string,
  options?: { regenerate?: boolean; periodIndex?: number }
): Promise<GenerateSnapshotResult> {
  await assertCanGenerate(institutionId);

  const preview = await previewNextReportPeriod(institutionId);
  if (!preview.period) {
    return {
      status: "skipped",
      institutionId,
      reason: preview.message,
    };
  }

  const result = await generateReportSnapshot({
    institutionId,
    generatedBy: "manual",
    periodIndex: options?.periodIndex ?? preview.period.periodIndex,
    regenerate: options?.regenerate ?? preview.alreadyExists,
  });

  revalidatePath(`/admin/${institutionId}/dashboard`);
  revalidatePath(`/admin/${institutionId}/reports`);
  revalidatePath(`/superadmin/institutions/${institutionId}/reports`);

  return result;
}
