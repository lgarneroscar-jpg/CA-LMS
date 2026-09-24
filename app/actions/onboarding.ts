"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function completeOnboarding() {
  const profile = await requireProfile();
  const supabase = await createClient();

  await supabase
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
