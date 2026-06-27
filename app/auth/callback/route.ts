import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHomePathForRole } from "@/lib/auth-routes";
import type { UserRole } from "@/types/index";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
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

        if (profile) {
          destination = getHomePathForRole(
            profile.role as UserRole,
            profile.institution_id
          );
        } else {
          destination = "/login?error=no_profile";
        }
      }

      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
