import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPreviewRequestNotice } from "@/lib/email";
import { grantPreviewAccess } from "@/lib/preview-account";
import { PREVIEW_INSTITUTION_ID } from "@/lib/preview";
import { domainIsDisposable } from "@/lib/disposable-email";
import {
  PREVIEW_REQUEST_DOMAIN_LIMIT,
  PREVIEW_REQUEST_DOMAIN_WINDOW_MS,
  PREVIEW_REQUEST_IP_LIMIT,
  PREVIEW_REQUEST_IP_WINDOW_MS,
  PREVIEW_REQUEST_SUCCESS_MESSAGE,
  classifyPreviewRequest,
  clientIp,
  previewCalendlyUrl,
  previewRequestFailureMessage,
  previewRequestLimitedMessage,
} from "@/lib/preview-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ORIGINS = new Set([
  "https://www.corpacad.com",
  "https://corpacad.com",
]);

const SUCCESS_BODY = {
  ok: true as const,
  message: PREVIEW_REQUEST_SUCCESS_MESSAGE,
};

function corsHeaders(request: Request): Headers | null {
  const origin = request.headers.get("origin");
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return null;
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Max-Age", "600");
  headers.set("Vary", "Origin");
  return headers;
}

function json(
  request: Request,
  body: unknown,
  status: number
): NextResponse {
  const headers = corsHeaders(request) ?? undefined;
  return NextResponse.json(body, { status, headers });
}

export function OPTIONS(request: Request) {
  const headers = corsHeaders(request);
  if (!headers) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, { status: 204, headers });
}

function notifyAddress(): string {
  return (
    process.env.PREVIEW_REQUEST_NOTIFY_EMAIL?.trim() || "oscarg@corpacad.com"
  );
}

async function notify(params: {
  email: string;
  fullName: string | null;
  institutionName: string | null;
  branch: "new account" | "already existed" | "could not create";
  detail?: string;
}) {
  try {
    await sendPreviewRequestNotice({ to: notifyAddress(), ...params });
  } catch (err) {
    console.error(
      "[preview-request] notice failed",
      err instanceof Error ? err.message : "unknown"
    );
  }
}

type AttemptGate = "ok" | "limited" | "unavailable";

async function consumeAttempt(
  admin: ReturnType<typeof createAdminClient>,
  ip: string,
  domain: string
): Promise<AttemptGate> {
  const hourAgo = new Date(Date.now() - PREVIEW_REQUEST_IP_WINDOW_MS).toISOString();
  const dayAgo = new Date(
    Date.now() - PREVIEW_REQUEST_DOMAIN_WINDOW_MS
  ).toISOString();

  const ipCount = await admin
    .from("preview_request_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", hourAgo);
  if (ipCount.error) return "unavailable";
  if ((ipCount.count ?? 0) >= PREVIEW_REQUEST_IP_LIMIT) return "limited";

  const domainCount = await admin
    .from("preview_request_attempts")
    .select("id", { count: "exact", head: true })
    .eq("email_domain", domain)
    .gte("created_at", dayAgo);
  if (domainCount.error) return "unavailable";
  if ((domainCount.count ?? 0) >= PREVIEW_REQUEST_DOMAIN_LIMIT) return "limited";

  const inserted = await admin
    .from("preview_request_attempts")
    .insert({ ip, email_domain: domain });
  if (inserted.error) return "unavailable";

  await admin.from("preview_request_attempts").delete().lt("created_at", dayAgo);
  return "ok";
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json(
      request,
      { ok: false, field: "email", message: "Enter a valid email address." },
      400
    );
  }
  if (!payload || typeof payload !== "object") {
    return json(
      request,
      { ok: false, field: "email", message: "Enter a valid email address." },
      400
    );
  }

  const body = payload as {
    email?: unknown;
    full_name?: unknown;
    institution_name?: unknown;
    company?: unknown;
  };

  const calendlyUrl = previewCalendlyUrl();
  const decision = classifyPreviewRequest(body, {
    calendlyUrl,
    isDisposable: domainIsDisposable,
  });

  if (decision.kind === "honeypot") {
    return json(request, SUCCESS_BODY, 200);
  }
  if (decision.kind === "invalid_email") {
    return json(
      request,
      { ok: false, field: "email", message: decision.message },
      400
    );
  }
  if (decision.kind === "blocked_domain") {
    return json(
      request,
      { ok: false, field: "email", message: decision.message },
      400
    );
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return json(
      request,
      {
        ok: false,
        message: previewRequestFailureMessage(calendlyUrl),
      },
      503
    );
  }

  const gate = await consumeAttempt(admin, clientIp(request), decision.domain);
  if (gate === "limited") {
    return json(
      request,
      { ok: false, message: previewRequestLimitedMessage(calendlyUrl) },
      429
    );
  }
  if (gate === "unavailable") {
    console.error("[preview-request] rate-limit store unavailable");
    return json(
      request,
      { ok: false, message: previewRequestFailureMessage(calendlyUrl) },
      503
    );
  }

  const result = await grantPreviewAccess(admin, {
    email: decision.email,
    fullName: decision.fullName,
  });

  if (!result.ok) {
    await notify({
      email: decision.email,
      fullName: decision.fullName,
      institutionName: decision.institutionName,
      branch: "could not create",
      detail: result.reason,
    });
    return json(
      request,
      {
        ok: false,
        message: previewRequestFailureMessage(calendlyUrl),
      },
      503
    );
  }

  await notify({
    email: decision.email,
    fullName: decision.fullName,
    institutionName: decision.institutionName,
    branch: result.branch === "created" ? "new account" : "already existed",
  });

  if (result.branch === "created") {
    revalidatePath("/superadmin");
    revalidatePath(`/superadmin/institutions/${PREVIEW_INSTITUTION_ID}`);
  }

  return json(request, SUCCESS_BODY, 200);
}
