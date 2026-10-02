"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  deriveInviteUiStatus,
  fetchAuthInviteStatuses,
  isSmtpNotConfiguredError,
  smtpFailureMessage,
  type InviteUiStatus,
} from "@/lib/auth-invite-status";
import { authCallbackUrl, passwordResetRedirectUrl } from "@/lib/auth-links";

export type InviteRowInput = {
  full_name: string;
  email: string;
};

export type InviteRowResult = {
  email: string;
  full_name: string;
  status: "sent" | "already_exists" | "failed";
  reason?: string;
};

async function assertSuperAdmin() {
  await requireRole(["super_admin"]);
}

/** Build a lowercase-email → auth user map (paginated, service role). */
async function loadAuthUsersByEmail(): Promise<
  Map<string, { id: string; email: string }>
> {
  const admin = createAdminClient();
  const map = new Map<string, { id: string; email: string }>();
  let page = 1;
  const perPage = 200;
  while (page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    for (const user of data.users) {
      if (!user.email) continue;
      map.set(user.email.toLowerCase(), { id: user.id, email: user.email });
    }
    if (data.users.length < perPage) break;
    page += 1;
  }
  return map;
}

export async function previewRosterAgainstExisting(
  institutionId: string,
  rows: InviteRowInput[]
): Promise<{
  existingStudentCount: number;
  alreadyUserEmails: string[];
}> {
  await assertSuperAdmin();
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("institution_id", institutionId)
    .eq("role", "student");
  if (error) throw new Error(error.message);

  const byEmail = await loadAuthUsersByEmail();
  const alreadyUserEmails = rows
    .map((r) => r.email.trim().toLowerCase())
    .filter((email) => byEmail.has(email));

  return {
    existingStudentCount: count ?? 0,
    alreadyUserEmails: [...new Set(alreadyUserEmails)],
  };
}

/**
 * Invite students. Adds to the institution roster — never replaces.
 * Never sets or transmits a password; invite link is how students set theirs.
 */
export async function inviteStudentsBatch(
  institutionId: string,
  rows: InviteRowInput[],
  options?: { confirmed?: boolean }
): Promise<{
  results: InviteRowResult[];
  sent: number;
  alreadyExists: number;
  failed: number;
  smtpNotConfigured: boolean;
}> {
  await assertSuperAdmin();

  if (!options?.confirmed) {
    throw new Error("Invitation requires explicit confirmation");
  }
  if (rows.length === 0) {
    throw new Error("No students to invite");
  }

  const supabase = await createClient();
  const { data: institution, error: instError } = await supabase
    .from("institutions")
    .select("id, name")
    .eq("id", institutionId)
    .single();
  if (instError || !institution) {
    throw new Error(instError?.message ?? "Institution not found");
  }

  const admin = createAdminClient();
  const byEmail = await loadAuthUsersByEmail();
  const redirectTo = authCallbackUrl();

  const results: InviteRowResult[] = [];
  let smtpNotConfigured = false;

  for (const row of rows) {
    const email = row.email.trim().toLowerCase();
    const full_name = row.full_name.trim();

    try {
      if (byEmail.has(email)) {
        results.push({
          email,
          full_name,
          status: "already_exists",
          reason: "An account with this email already exists",
        });
        continue;
      }

      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: {
          role: "student",
          institution_id: institutionId,
          full_name,
        },
        redirectTo,
      });

      if (error) {
        const message = error.message;
        if (isSmtpNotConfiguredError(message)) {
          smtpNotConfigured = true;
          results.push({
            email,
            full_name,
            status: "failed",
            reason: smtpFailureMessage(),
          });
        } else {
          results.push({
            email,
            full_name,
            status: "failed",
            reason: message,
          });
        }
        continue;
      }

      if (data.user?.email) {
        byEmail.set(data.user.email.toLowerCase(), {
          id: data.user.id,
          email: data.user.email,
        });
      }

      results.push({ email, full_name, status: "sent" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (isSmtpNotConfiguredError(message)) {
        smtpNotConfigured = true;
        results.push({
          email,
          full_name,
          status: "failed",
          reason: smtpFailureMessage(),
        });
      } else {
        results.push({ email, full_name, status: "failed", reason: message });
      }
    }
  }

  revalidatePath(`/superadmin/institutions/${institutionId}`);
  revalidatePath("/superadmin");
  revalidatePath("/superadmin/institutions");
  revalidatePath(`/admin/${institutionId}/students`);
  revalidatePath(`/admin/${institutionId}/dashboard`);

  return {
    results,
    sent: results.filter((r) => r.status === "sent").length,
    alreadyExists: results.filter((r) => r.status === "already_exists").length,
    failed: results.filter((r) => r.status === "failed").length,
    smtpNotConfigured,
  };
}

export type ResendInviteResult =
  | { ok: true; via: "invite" | "password_link"; sentAt: string }
  | { ok: false; reason: string };

export async function resendStudentInvite(
  institutionId: string,
  studentId: string
): Promise<ResendInviteResult> {
  await assertSuperAdmin();

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, full_name, institution_id, role")
    .eq("id", studentId)
    .single();

  if (error || !profile) {
    return { ok: false, reason: error?.message ?? "Student not found" };
  }
  if (profile.institution_id !== institutionId || profile.role !== "student") {
    return { ok: false, reason: "Student is not on this institution roster" };
  }

  const statuses = await fetchAuthInviteStatuses([studentId]);
  const status = statuses.get(studentId);
  if (!status?.email) {
    return { ok: false, reason: "No email found for this student in auth" };
  }
  if (status.lastSignInAt) {
    return { ok: false, reason: "Student has already accepted and signed in" };
  }

  // Re-inviting an unconfirmed user issues a new token, invalidating the
  // expired one and updating invited_at.
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    status.email,
    {
      data: {
        role: "student",
        institution_id: institutionId,
        full_name: profile.full_name ?? status.email.split("@")[0],
      },
      redirectTo: authCallbackUrl(),
    }
  );

  if (!inviteError) {
    revalidatePath(`/superadmin/institutions/${institutionId}`);
    return { ok: true, via: "invite", sentAt: new Date().toISOString() };
  }

  if (isSmtpNotConfiguredError(inviteError.message)) {
    return { ok: false, reason: smtpFailureMessage() };
  }

  // Supabase refuses to re-invite an already-confirmed email. A password link
  // lands on the same set-password page, so it serves the same purpose.
  const { error: recoveryError } = await admin.auth.resetPasswordForEmail(
    status.email,
    { redirectTo: passwordResetRedirectUrl() }
  );

  if (recoveryError) {
    return {
      ok: false,
      reason: isSmtpNotConfiguredError(recoveryError.message)
        ? smtpFailureMessage()
        : `${inviteError.message}; password link also failed: ${recoveryError.message}`,
    };
  }

  revalidatePath(`/superadmin/institutions/${institutionId}`);
  return { ok: true, via: "password_link", sentAt: new Date().toISOString() };
}

export type RosterStudentRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  xp: number;
  is_demo: boolean;
  inviteStatus: InviteUiStatus;
  invitedAt: string | null;
  lastLinkSentAt: string | null;
  lastSignInAt: string | null;
};

export async function getInstitutionRoster(
  institutionId: string
): Promise<RosterStudentRow[]> {
  await assertSuperAdmin();
  const supabase = await createClient();

  const { data: students, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, xp, rank, last_login, last_active_date, diagnostic_complete, created_at, is_demo"
    )
    .eq("institution_id", institutionId)
    .eq("role", "student")
    .order("full_name");

  if (error) throw new Error(error.message);

  const ids = (students ?? []).map((s) => s.id);
  const authStatuses = await fetchAuthInviteStatuses(ids);

  return (students ?? []).map((student) => {
    const auth = authStatuses.get(student.id);
    const inviteStatus = auth
      ? deriveInviteUiStatus(auth)
      : ("unknown" as const);

    return {
      id: student.id,
      full_name: student.full_name,
      email: auth?.email ?? null,
      xp: student.xp,
      is_demo: student.is_demo,
      inviteStatus,
      invitedAt: auth?.invitedAt ?? student.created_at,
      lastLinkSentAt: auth?.lastLinkSentAt ?? auth?.invitedAt ?? null,
      lastSignInAt: auth?.lastSignInAt ?? null,
    };
  });
}
