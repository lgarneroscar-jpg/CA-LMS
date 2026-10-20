/**
 * Public preview-request validation. The route at app/api/preview-request
 * is the only caller. Account creation lives in lib/preview-account.ts.
 *
 * Every accepted outcome (new account, existing account, honeypot) shares
 * PREVIEW_REQUEST_SUCCESS_MESSAGE. Only validation failures differ, and
 * those say nothing about whether an account exists.
 */

export const PREVIEW_REQUEST_SUCCESS_MESSAGE =
  "Check your email — if that address is eligible, a sign-in link is on its way.";

export const PREVIEW_REQUEST_IP_LIMIT = 3;
export const PREVIEW_REQUEST_IP_WINDOW_MS = 60 * 60 * 1000;
export const PREVIEW_REQUEST_DOMAIN_LIMIT = 10;
export const PREVIEW_REQUEST_DOMAIN_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Consumer mailbox providers. Exact domain match. Extend this list in place. */
export const FREE_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "ymail.com",
  "rocketmail.com",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "yandex.ru",
  "qq.com",
  "163.com",
  "126.com",
  "fastmail.com",
  "hey.com",
  "tutanota.com",
  "tuta.io",
  "duck.com",
] as const;

const FREE_EMAIL_DOMAIN_SET = new Set<string>(FREE_EMAIL_DOMAINS);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_MAX = 120;
const INSTITUTION_MAX = 160;

export function previewCalendlyUrl(): string | null {
  const raw = process.env.PREVIEW_REQUEST_CALENDLY_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function withCalendly(message: string, calendlyUrl: string | null): string {
  if (calendlyUrl) return `${message} Book a call instead: ${calendlyUrl}`;
  return `${message} Book a call from corpacad.com instead.`;
}

export function workEmailMessage(calendlyUrl: string | null): string {
  return withCalendly(
    "Use your institutional or work address. Personal inboxes aren't eligible for an automatic preview.",
    calendlyUrl
  );
}

export function previewRequestLimitedMessage(calendlyUrl: string | null): string {
  return withCalendly(
    "Too many preview requests from this network. Try again later.",
    calendlyUrl
  );
}

export function previewRequestFailureMessage(calendlyUrl: string | null): string {
  return withCalendly("We couldn't complete that request.", calendlyUrl);
}

export function isFreeEmailDomain(domain: string): boolean {
  return FREE_EMAIL_DOMAIN_SET.has(domain);
}

/** True when the domain, or a parent of it, is on the maintained disposable list. */
export function isDisposableEmailDomain(
  domain: string,
  disposableDomains: ReadonlySet<string>
): boolean {
  if (disposableDomains.has(domain)) return true;
  const labels = domain.split(".");
  for (let i = 1; i < labels.length - 1; i += 1) {
    if (disposableDomains.has(labels.slice(i).join("."))) return true;
  }
  return false;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  return "unknown";
}

function optionalText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function honeypotTripped(company: unknown): boolean {
  if (company == null) return false;
  if (typeof company === "string") return company.trim().length > 0;
  return true;
}

export type PreviewRequestDecision =
  | { kind: "honeypot" }
  | { kind: "invalid_email"; message: string }
  | { kind: "blocked_domain"; message: string }
  | {
      kind: "ready";
      email: string;
      domain: string;
      fullName: string | null;
      institutionName: string | null;
    };

export function classifyPreviewRequest(
  input: {
    email?: unknown;
    full_name?: unknown;
    institution_name?: unknown;
    company?: unknown;
  },
  options?: {
    calendlyUrl?: string | null;
    isDisposable?: (domain: string) => boolean;
  }
): PreviewRequestDecision {
  if (honeypotTripped(input.company)) return { kind: "honeypot" };

  if (typeof input.email !== "string") {
    return { kind: "invalid_email", message: "Enter a valid email address." };
  }
  const email = input.email.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return { kind: "invalid_email", message: "Enter a valid email address." };
  }

  const domain = email.slice(email.lastIndexOf("@") + 1);
  const calendlyUrl = options?.calendlyUrl ?? null;
  if (
    isFreeEmailDomain(domain) ||
    options?.isDisposable?.(domain)
  ) {
    return { kind: "blocked_domain", message: workEmailMessage(calendlyUrl) };
  }

  return {
    kind: "ready",
    email,
    domain,
    fullName: optionalText(input.full_name, NAME_MAX),
    institutionName: optionalText(input.institution_name, INSTITUTION_MAX),
  };
}
