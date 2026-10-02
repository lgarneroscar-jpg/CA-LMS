import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getHomePathForRole } from "@/lib/auth-routes";
import {
  SET_PASSWORD_PATH,
  safeNextPath,
  setPasswordModeForType,
  setPasswordPath,
} from "@/lib/auth-links";
import type { UserRole } from "@/types/index";

const LINK_EXPIRED = "/login?error=link_expired";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const nextParam = safeNextPath(searchParams.get("next"));

  // Supabase appends error params when /verify rejects an expired or used link.
  if (searchParams.get("error") || searchParams.get("error_code")) {
    return NextResponse.redirect(`${origin}${LINK_EXPIRED}`);
  }

  // Implicit-flow links (the default for admin-issued invites) carry the session
  // in the URL fragment, which never reaches the server. The browser keeps the
  // fragment across this redirect so the client page can read it.
  if (!code && !tokenHash) {
    return NextResponse.redirect(`${origin}/auth/confirm`);
  }

  const supabase = await createClient();

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : type
      ? await supabase.auth.verifyOtp({
          token_hash: tokenHash!,
          type: type as EmailOtpType,
        })
      : { error: new Error("token_hash link is missing type") };

  if (error) {
    return NextResponse.redirect(`${origin}${LINK_EXPIRED}`);
  }

  const passwordMode =
    setPasswordModeForType(type) ??
    (nextParam === SET_PASSWORD_PATH ? "recovery" : null);
  if (passwordMode) {
    return NextResponse.redirect(`${origin}${setPasswordPath(passwordMode)}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let destination = nextParam ?? "/";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, institution_id")
      .eq("id", user.id)
      .maybeSingle();

    destination = profile
      ? getHomePathForRole(profile.role as UserRole, profile.institution_id)
      : "/login?error=no_profile";
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
