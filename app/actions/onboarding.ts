"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";

export async function completeOnboarding() {
  const profile = await requireProfile();

  // onboarding_complete is not client-writable; the id comes from the session.
  await createAdminClient()
    .from("profiles")
    .update({ onboarding_complete: true })
    .eq("id", profile.id);

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  return { success: true };
}

// submitDiagnostic was removed when CAPRI replaced the invented entry
// diagnostic. The Week 1 baseline is now app/actions/capri.ts -> submitCapri.
// Historic diagnostic_responses rows are left untouched.
