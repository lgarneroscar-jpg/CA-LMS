import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { refreshStreakIfLapsed } from "@/lib/streaks";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LoginTracker } from "@/components/layout/login-tracker";
import type { UserRole } from "@/types/index";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getAuthContext();
  if (!user) redirect("/login");
  if (!profile) redirect("/login?error=no_profile");

  const supabase = await createClient();

  if (profile.role === "student" && profile.program_started_at) {
    await refreshStreakIfLapsed(
      supabase,
      profile.id,
      profile.program_started_at
    );
  }

  const { data: notifications } =
    profile.role === "student"
      ? await supabase
          .from("notifications")
          .select("id, type, message, is_read, created_at")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(12)
      : { data: [] };

  const unreadCount =
    notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="flex min-h-full flex-col">
      <LoginTracker />
      <AppHeader
        profile={profile}
        notifications={notifications ?? []}
        unreadCount={unreadCount}
      />
      <div className="flex flex-1 flex-col md:flex-row">
        <AppSidebar
          role={profile.role as UserRole}
          institutionId={profile.institution_id}
          isDemo={profile.is_demo}
        />
        <main className="flex-1 overflow-auto bg-muted/30 p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
      </div>
      {profile.role === "student" ? <MobileNav /> : null}
    </div>
  );
}
