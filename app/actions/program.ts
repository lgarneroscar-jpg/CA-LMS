"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";

export async function startProgram() {
  const profile = await requireProfile();
  if (profile.role !== "student" && !profile.is_demo) {
    throw new Error("Students only");
  }

  if (profile.program_started_at) {
    return { success: true, alreadyStarted: true };
  }

  const startedAt = new Date().toISOString();

  // program_started_at is not client-writable; the id comes from the session.
  const { error } = await createAdminClient()
    .from("profiles")
    .update({ program_started_at: startedAt })
    .eq("id", profile.id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/program");
  return { success: true, startedAt };
}
