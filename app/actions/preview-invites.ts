"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantPreviewAccess } from "@/lib/preview-account";
import { PREVIEW_INSTITUTION_ID } from "@/lib/preview";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALREADY_EXISTS =
  "An account with this email already exists. Existing accounts are not moved into the preview.";

export type PreviewInviteResult =
  | { ok: true; email: string }
  | { ok: false; reason: string };

/**
 * Invites one prospect into the preview institution as a student. Never sets
 * or transmits a password: the invite link signs them straight in.
 *
 * An address that already has an account is refused rather than moved —
 * moving a real student into a demo institution would make them is_demo,
 * force their answers private and drop them from their cohort's reporting.
 */
export async function invitePreviewUser(input: {
  email: string;
  fullName?: string;
}): Promise<PreviewInviteResult> {
  await requireRole(["super_admin"]);

  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName?.trim() || null;
  if (!EMAIL_RE.test(email)) {
    return { ok: false, reason: "Enter a valid email address." };
  }

  const result = await grantPreviewAccess(createAdminClient(), {
    email,
    fullName,
  });
  if (!result.ok) return { ok: false, reason: result.reason };
  if (result.branch === "exists") {
    return { ok: false, reason: ALREADY_EXISTS };
  }

  revalidatePath("/superadmin");
  revalidatePath(`/superadmin/institutions/${PREVIEW_INSTITUTION_ID}`);
  return { ok: true, email };
}
