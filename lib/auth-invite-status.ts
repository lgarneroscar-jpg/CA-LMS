import { createAdminClient } from "@/lib/supabase/admin";

export type AuthInviteStatus = {
  userId: string;
  email: string | null;
  /** ISO timestamp when the auth user was created / invited. */
  invitedAt: string | null;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
};

export type InviteUiStatus = "accepted" | "pending" | "unknown";

/** Days after invite before "not yet accepted" becomes an attention reason. */
export const INVITE_PENDING_ATTENTION_DAYS = 7;

export function deriveInviteUiStatus(status: {
  lastSignInAt: string | null;
  emailConfirmedAt?: string | null;
}): InviteUiStatus {
  if (status.lastSignInAt) return "accepted";
  // Confirmed without sign-in still counts as not-yet-accepted for our purposes —
  // invite acceptance = they've actually signed in.
  return "pending";
}

export function invitePendingDays(
  status: { invitedAt: string | null; lastSignInAt: string | null },
  now = new Date()
): number | null {
  if (status.lastSignInAt) return null;
  if (!status.invitedAt) return null;
  const invited = new Date(status.invitedAt);
  if (Number.isNaN(invited.getTime())) return null;
  return Math.max(
    0,
    Math.floor((now.getTime() - invited.getTime()) / (24 * 60 * 60 * 1000))
  );
}

/**
 * Service-role lookup of auth invite/sign-in fields for institution students.
 * Exposes only status fields — never tokens or secrets.
 */
export async function fetchAuthInviteStatuses(
  userIds: string[]
): Promise<Map<string, AuthInviteStatus>> {
  const map = new Map<string, AuthInviteStatus>();
  if (userIds.length === 0) return map;

  const wanted = new Set(userIds);
  const admin = createAdminClient();

  let page = 1;
  const perPage = 200;
  while (page <= 20 && map.size < wanted.size) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("[auth-invite-status]", error.message);
      throw new Error(`auth invite status: ${error.message}`);
    }

    for (const user of data.users) {
      if (!wanted.has(user.id)) continue;
      map.set(user.id, {
        userId: user.id,
        email: user.email ?? null,
        invitedAt: user.invited_at ?? user.created_at ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
        emailConfirmedAt: user.email_confirmed_at ?? null,
      });
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  return map;
}

export function isSmtpNotConfiguredError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("email address not authorized") ||
    lower.includes("error sending invite email") ||
    (lower.includes("smtp") && lower.includes("not configured")) ||
    (lower.includes("unable to send") && lower.includes("email"))
  );
}

export function smtpFailureMessage(): string {
  return "Invite could not be sent: custom SMTP is not configured in Supabase Auth. Built-in email only delivers to project team members. Configure Authentication → SMTP Settings (Resend, Postmark, SES, SendGrid, or Brevo) before inviting students.";
}
