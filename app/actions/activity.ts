"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";

export async function recordLoginEvent() {
  const profile = await requireProfile();
  const supabase = await createClient();

  await supabase.from("login_events").insert({ user_id: profile.id });
  // last_login is not client-writable; the id comes from the session.
  await createAdminClient()
    .from("profiles")
    .update({ last_login: new Date().toISOString() })
    .eq("id", profile.id);

  return { success: true };
}
