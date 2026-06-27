"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function recordLoginEvent() {
  const profile = await requireProfile();
  const supabase = await createClient();

  await supabase.from("login_events").insert({ user_id: profile.id });
  await supabase
    .from("profiles")
    .update({ last_login: new Date().toISOString() })
    .eq("id", profile.id);

  return { success: true };
}
