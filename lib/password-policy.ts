import type { AuthError } from "@supabase/supabase-js";
import { SUPPORT_EMAIL } from "@/lib/constants";

/**
 * Mirrors Supabase Auth → Password requirements for this project (minimum 10
 * characters; lowercase, uppercase, digit and symbol all required). If the
 * dashboard setting changes, change these to match, or the checklist will
 * promise something the server rejects.
 */
export const PASSWORD_MIN_LENGTH = 10;

/** The symbol set Supabase accepts for the "symbol" requirement. Spaces do not count. */
const PASSWORD_SYMBOLS = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~";

export type PasswordRule = {
  id: "length" | "lower" | "upper" | "digit" | "symbol";
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (pw) => pw.length >= PASSWORD_MIN_LENGTH,
  },
  { id: "lower", label: "A lowercase letter (a–z)", test: (pw) => /[a-z]/.test(pw) },
  { id: "upper", label: "An uppercase letter (A–Z)", test: (pw) => /[A-Z]/.test(pw) },
  { id: "digit", label: "A number (0–9)", test: (pw) => /[0-9]/.test(pw) },
  {
    id: "symbol",
    label: "A symbol, such as ! ? # @ or -",
    test: (pw) => [...pw].some((c) => PASSWORD_SYMBOLS.includes(c)),
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

  if (code === "weak_password") {
    const reasons = error.reasons ?? [];
    if (reasons.includes("pwned")) {
      return "That password has appeared in a known data breach, so it isn't safe to use. Please choose a different one.";
    }
    const parts: string[] = [];
    if (reasons.includes("length")) {
      parts.push(`at least ${PASSWORD_MIN_LENGTH} characters`);
    }
    if (reasons.includes("characters")) {
      parts.push("a lowercase letter, an uppercase letter, a number and a symbol");
    }
    return parts.length > 0
      ? `Your password needs ${parts.join(", and ")}.`
      : "That password isn't strong enough. Check the requirements above and try again.";
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
