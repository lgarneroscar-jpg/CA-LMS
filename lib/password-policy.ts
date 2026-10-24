import type { AuthError } from "@supabase/supabase-js";
import { SUPPORT_EMAIL } from "@/lib/constants";

/**
 * Mirrors Supabase Auth → Password requirements for this project, as set on
 * 2026-10-20: minimum 12 characters, no required character classes.
 * Leaked-password protection is on in the dashboard (HaveIBeenPwned); that
 * rejection is mapped in passwordErrorMessage, not as a checklist row.
 * If the dashboard setting changes, change this to match, or the checklist
 * will promise something the server rejects.
 */
export const PASSWORD_MIN_LENGTH = 12;

export type PasswordRule = {
  id: "length";
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (pw) => pw.length >= PASSWORD_MIN_LENGTH,
  },
];

export function passwordMeetsPolicy(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

type AuthErrorLike = Pick<AuthError, "message"> & {
  code?: string;
  status?: number;
  reasons?: string[];
  name?: string;
};

/** Written sentences for Supabase auth errors on password changes. Never returns server text. */
export function passwordErrorMessage(error: AuthErrorLike): string {
  const code = error.code;

  if (code === "weak_password" || error.name === "AuthWeakPasswordError") {
    const reasons = error.reasons ?? [];
    const leaked =
      reasons.includes("pwned") ||
      /pwned|breach|leaked/i.test(error.message ?? "");
    if (leaked) {
      return "That password has appeared in a known data breach. Please choose another.";
    }
    if (reasons.includes("length")) {
      return `Your password needs at least ${PASSWORD_MIN_LENGTH} characters.`;
    }
    return "That password isn't strong enough. Check the requirements above and try again.";
  }
  if (code === "same_password") {
    return "That's already your password. Choose a different one, or keep using the one you have.";
  }
  if (code === "reauthentication_needed" || code === "reauthentication_not_valid") {
    return "For security, this change needs a fresh sign-in. Sign out, sign back in with an email link, then set your password straight away.";
  }
  if (
    code === "session_not_found" ||
    code === "session_expired" ||
    code === "refresh_token_not_found" ||
    error.status === 401 ||
    error.status === 403
  ) {
    return "Your sign-in has ended. Sign in again, then set your password.";
  }
  if (code === "over_request_rate_limit" || error.status === 429) {
    return "Too many attempts in a short time. Wait a minute, then try again.";
  }
  if (error.name === "AuthRetryableFetchError" || error.status === 0) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  return `We couldn't save your password. Please try again, or email ${SUPPORT_EMAIL} if it keeps happening.`;
}
