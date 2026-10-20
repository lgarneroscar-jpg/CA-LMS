import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SetPasswordForm } from "@/components/auth/set-password-form";
import { AuthShell } from "@/components/auth/auth-shell";

type Props = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function SetPasswordPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=link_expired");
  }

  // Invited users go straight into the programme; a password is offered later.
  const { mode } = await searchParams;
  if (mode !== "recovery") {
    redirect("/");
  }

  // A student who has not finished onboarding is still effectively accepting an
  // invite (e.g. via "Email me a sign-in link" after it expired).
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_demo, onboarding_complete")
    .eq("id", user.id)
    .maybeSingle();
  if (
    profile?.role === "student" &&
    !profile.is_demo &&
    !profile.onboarding_complete
  ) {
    redirect("/");
  }

  return (
    <AuthShell>
      <SetPasswordForm email={user.email ?? null} />
    </AuthShell>
  );
}
