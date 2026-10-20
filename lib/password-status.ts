import { getAuthContext } from "@/lib/auth";

export type PasswordStatus = {
  hasPassword: boolean;
  promptDismissed: boolean;
};

/**
 * Supabase does not expose whether an account has a password. `has_password`
 * is set by our password form; a session that signed in with a password proves
 * one exists for accounts that set it before that flag existed.
 */
export async function getPasswordStatus(): Promise<PasswordStatus> {
  const { user, supabase } = await getAuthContext();
  if (!user) return { hasPassword: false, promptDismissed: false };

  const metadata = user.user_metadata ?? {};
  const { data } = await supabase.auth.getClaims();
  const amr = (data?.claims.amr ?? []) as { method?: string }[];

  return {
    hasPassword:
      metadata.has_password === true || amr.some((m) => m.method === "password"),
    promptDismissed: Boolean(metadata.password_prompt_dismissed_at),
  };
}
