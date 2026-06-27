import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getHomePathForRole } from "@/lib/auth-routes";
import type { UserRole } from "@/types/index";

const PUBLIC_PATHS = ["/login", "/auth/callback"];

/** Routes that need profile/role data for redirects or guards */
function needsProfileLookup(pathname: string): boolean {
  if (pathname === "/" || pathname === "/login") return true;
  if (pathname.startsWith("/admin") || pathname.startsWith("/superadmin"))
    return true;
  if (
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/diagnostic") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/program") ||
    pathname.startsWith("/profile")
  ) {
    return true;
  }
  return false;
}

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((c) => c.name.includes("-auth-token"));
}

type ProfileClaims = {
  role: string;
  institution_id: string | null;
  is_demo?: boolean;
  onboarding_complete?: boolean;
  diagnostic_complete?: boolean;
};

async function getProfileForUser(
  supabase: ReturnType<typeof createServerClient<Database>>,
  userId: string
): Promise<ProfileClaims | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, institution_id, is_demo, onboarding_complete, diagnostic_complete")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes handle their own auth
  if (pathname.startsWith("/api/")) {
    return NextResponse.next({ request });
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Fast path: no auth cookie — skip Supabase network calls
  if (!hasSupabaseAuthCookie(request)) {
    if (pathname === "/") return redirectTo(request, "/login");
    if (!isPublic) return redirectTo(request, "/login");
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (pathname === "/") return redirectTo(request, "/login");
    if (!isPublic) return redirectTo(request, "/login");
    return supabaseResponse;
  }

  // Student app routes: session refresh only, no profile query
  if (!needsProfileLookup(pathname)) {
    return supabaseResponse;
  }

  const profile = await getProfileForUser(supabase, user.id);
  const home = profile
    ? getHomePathForRole(profile.role as UserRole, profile.institution_id)
    : null;

  if (!profile || !home) {
    if (pathname !== "/login") {
      return redirectTo(request, "/login?error=no_profile");
    }
    return supabaseResponse;
  }

  if (pathname === "/" || pathname === "/login") {
    return redirectTo(request, home);
  }

  if (
    profile.role === "student" &&
    !profile.is_demo &&
    pathname.startsWith("/admin")
  ) {
    return redirectTo(request, "/dashboard");
  }

  if (profile.role === "student" && pathname.startsWith("/superadmin")) {
    return redirectTo(request, home);
  }

  if (
    profile.role === "student" &&
    !profile.is_demo &&
    !pathname.startsWith("/onboarding") &&
    profile.onboarding_complete === false
  ) {
    return redirectTo(request, "/onboarding");
  }

  if (
    profile.role === "student" &&
    !profile.is_demo &&
    !pathname.startsWith("/onboarding") &&
    !pathname.startsWith("/diagnostic") &&
    profile.onboarding_complete !== false &&
    profile.diagnostic_complete === false
  ) {
    return redirectTo(request, "/diagnostic");
  }

  if (
    profile.role === "institutional_admin" &&
    pathname.startsWith("/superadmin")
  ) {
    return redirectTo(request, home);
  }

  if (
    profile.role === "institutional_admin" &&
    pathname.startsWith("/admin") &&
    profile.institution_id &&
    !pathname.startsWith(`/admin/${profile.institution_id}`)
  ) {
    return redirectTo(request, home);
  }

  if (
    profile.role !== "super_admin" &&
    pathname.startsWith("/superadmin")
  ) {
    return redirectTo(request, home);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
