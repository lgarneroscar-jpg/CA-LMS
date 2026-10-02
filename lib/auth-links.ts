export const SET_PASSWORD_PATH = "/auth/set-password";

export type SetPasswordMode = "invite" | "recovery";

/**
 * Public origin used in emailed auth links. Must match a Redirect URL in
 * Supabase Auth → URL Configuration, otherwise Supabase rejects the redirect.
 * VERCEL_URL is deployment-specific and is not in that allowlist, so the
 * stable production domain is preferred over it.
 */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";
  const trimmed = raw.replace(/\/$/, "");
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

export function authCallbackUrl(origin: string = siteUrl()): string {
  return `${origin}/auth/callback`;
}

export function passwordResetRedirectUrl(origin: string = siteUrl()): string {
  return `${authCallbackUrl(origin)}?next=${encodeURIComponent(SET_PASSWORD_PATH)}`;
}

/** Same-origin relative paths only — rejects absolute and protocol-relative URLs. */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return null;
  }
  return next;
}

/** Supabase link `type` values that require the user to choose a password. */
export function setPasswordModeForType(
  type: string | null | undefined
): SetPasswordMode | null {
  if (type === "invite") return "invite";
  if (type === "recovery") return "recovery";
  return null;
}

export function setPasswordPath(mode: SetPasswordMode): string {
  return `${SET_PASSWORD_PATH}?mode=${mode}`;
}
