"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { DIAGNOSTIC_QUESTIONS } from "@/lib/onboarding-content";

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

export async function submitDiagnostic(responses: Record<string, string>) {
  const profile = await requireProfile();
  const supabase = await createClient();

  for (const question of DIAGNOSTIC_QUESTIONS) {
    const value = responses[question.key]?.trim();
    if (!value) {
      throw new Error(`Please answer: ${question.label}`);
    }

    await supabase.from("diagnostic_responses").upsert(
      {
        student_id: profile.id,
        question_key: question.key,
        response: value,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "student_id,question_key" }
    );
  }

  await supabase
    .from("profiles")
    .update({ diagnostic_complete: true })
    .eq("id", profile.id);

  revalidatePath("/dashboard");
  revalidatePath("/diagnostic");
  revalidatePath("/program");
  return { success: true };
}
