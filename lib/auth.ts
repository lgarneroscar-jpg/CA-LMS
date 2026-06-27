import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/index";
import { getHomePathForRole } from "@/lib/auth-routes";

export { getHomePathForRole } from "@/lib/auth-routes";

/** One auth round-trip per request — shared by layout, pages, and actions. */
export const getAuthContext = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null as Profile | null, supabase };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getAuthContext]", error.message);
    return { user, profile: null as Profile | null, supabase };
  }

  return { user, profile, supabase };
});

export async function getSessionUser() {
  const { user } = await getAuthContext();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const { profile } = await getAuthContext();
  return profile;
}

export async function requireProfile(): Promise<Profile> {
  const { user, profile } = await getAuthContext();
  if (!user) redirect("/login");
  if (!profile) redirect("/login?error=no_profile");
  return profile;
}

export async function requireRole(allowed: UserRole[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!allowed.includes(profile.role as UserRole)) {
    const isDemo = profile.is_demo;
    const isSuperAdminOnlyGate =
      allowed.length === 1 && allowed[0] === "super_admin";

    if (isDemo && !isSuperAdminOnlyGate) {
      return profile;
    }

    redirect(
      getHomePathForRole(profile.role as UserRole, profile.institution_id)
    );
  }
  return profile;
}
