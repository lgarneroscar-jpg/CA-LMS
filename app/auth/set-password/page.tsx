import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SetPasswordForm } from "@/components/auth/set-password-form";

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

  const { mode } = await searchParams;

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-muted/40 p-4">
      <SetPasswordForm
        mode={mode === "recovery" ? "recovery" : "invite"}
        email={user.email ?? null}
      />
    </div>
  );
}
