import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  isSmtpNotConfiguredError,
  smtpFailureMessage,
} from "@/lib/auth-invite-status";
import { authCallbackUrl } from "@/lib/auth-links";
import { PREVIEW_INSTITUTION_ID } from "@/lib/preview";
import { provisionProfile } from "@/lib/provision-profile";

type AdminClient = SupabaseClient<Database>;

/** Null when the lookup itself failed. */
async function authUserExists(
  admin: AdminClient,
  email: string
): Promise<boolean | null> {
  const perPage = 200;
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) return null;
    if (data.users.some((user) => user.email?.toLowerCase() === email)) return true;
    if (data.users.length < perPage) return false;
  }
  return null;
}

export type PreviewAccessResult =
  | { ok: true; branch: "created" | "exists" }
  | { ok: false; reason: string };

/**
 * Opens a student preview, or reports that the address already has an account.
 * Never sets a password and never moves an existing account between institutions.
 * Callers decide what to show: the admin action names the existing-account case,
 * the public endpoint must not.
 */
export async function grantPreviewAccess(
  admin: AdminClient,
  input: { email: string; fullName: string | null }
): Promise<PreviewAccessResult> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName?.trim() || null;

  const { data: institution, error: institutionError } = await admin
    .from("institutions")
    .select("id, is_demo")
    .eq("id", PREVIEW_INSTITUTION_ID)
    .maybeSingle();
  if (institutionError || !institution) {
    return { ok: false, reason: "The preview institution could not be found." };
  }
  if (!institution.is_demo) {
    return {
      ok: false,
      reason:
        "The preview institution is not marked as a demo institution, so invites are disabled.",
    };
  }

  // inviteUserByEmail silently re-invites an unconfirmed address instead of
  // failing, so existing accounts must be ruled out before calling it.
  const existing = await authUserExists(admin, email);
  if (existing === null) {
    return { ok: false, reason: "Couldn't check for an existing account. Try again." };
  }
  if (existing) return { ok: true, branch: "exists" };

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: fullName ? { full_name: fullName } : undefined,
    redirectTo: authCallbackUrl(),
  });

  if (error) {
    if (error.code === "email_exists" || /already been registered/i.test(error.message)) {
      return { ok: true, branch: "exists" };
    }
    if (isSmtpNotConfiguredError(error.message)) {
      return { ok: false, reason: smtpFailureMessage() };
    }
    return { ok: false, reason: error.message };
  }
  if (!data.user) {
    return { ok: false, reason: "Invite returned no user." };
  }

  const { error: profileError } = await provisionProfile(admin, {
    userId: data.user.id,
    role: "student",
    institutionId: PREVIEW_INSTITUTION_ID,
    fullName: fullName ?? email.split("@")[0],
  });
  if (profileError) {
    return {
      ok: false,
      reason: `Invite email sent, but the profile could not be attached to the preview: ${profileError}`,
    };
  }

  return { ok: true, branch: "created" };
}
