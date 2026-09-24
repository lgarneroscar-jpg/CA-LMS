"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import {
  ensureAdministration,
  fetchActiveItems,
  getOrCreateResponse,
  saveAnswers,
  submitResponse,
  type AdministrationType,
} from "@/lib/capri/queries";
import type { CapriAnswer, RatingContext } from "@/lib/capri/scoring";

type IncomingAnswer = {
  itemId: string;
  ratingContext: RatingContext;
  rawValue: number;
};

/**
 * The client never tells us which response row to write to — it names the
 * administration, and we resolve the student's own response server-side. That
 * removes any path where a crafted request writes into someone else's baseline.
 */
async function resolveOwnResponse(administrationType: AdministrationType) {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (!profile.institution_id) {
    throw new Error(
      "You are not assigned to a cohort yet. Contact your program administrator."
    );
  }

  if (administrationType === "post" && !profile.program_completed_at) {
    throw new Error(
      "The Week 12 assessment unlocks once you have completed the program content."
    );
  }

  const adminClient = createAdminClient();
  const administrationId = await ensureAdministration(
    adminClient,
    profile.institution_id,
    administrationType
  );
  const response = await getOrCreateResponse(
    supabase,
    administrationId,
    profile.id
  );

  return { profile, supabase, adminClient, administrationId, response };
}

function sanitize(answers: IncomingAnswer[]): CapriAnswer[] {
  return answers
    .filter(
      (a) =>
        typeof a.itemId === "string" &&
        Number.isInteger(a.rawValue) &&
        a.rawValue >= 0 &&
        a.rawValue <= 5 &&
        (a.ratingContext === "current" || a.ratingContext === "retrospective")
    )
    .map((a) => ({
      itemId: a.itemId,
      ratingContext: a.ratingContext,
      rawValue: a.rawValue,
    }));
}

/** Autosave. Safe to call repeatedly; a submitted response rejects the write. */
export async function saveCapriProgress(
  administrationType: AdministrationType,
  answers: IncomingAnswer[]
) {
  const { supabase, response } = await resolveOwnResponse(administrationType);

  if (response.submittedAt) {
    return { success: false, alreadySubmitted: true as const };
  }

  await saveAnswers(supabase, response.id, sanitize(answers));
  return { success: true, alreadySubmitted: false as const };
}

export async function submitCapri(
  administrationType: AdministrationType,
  answers: IncomingAnswer[],
  durationSeconds: number | null
) {
  const { profile, supabase, adminClient, response } =
    await resolveOwnResponse(administrationType);

  if (response.submittedAt) {
    throw new Error("You have already submitted this assessment.");
  }

  const clean = sanitize(answers);
  await saveAnswers(supabase, response.id, clean);

  const items = await fetchActiveItems(supabase);

  // scoreResponse throws on a partial response rather than averaging a subset,
  // so this is also the completeness check.
  const scored = await submitResponse(adminClient, {
    responseId: response.id,
    items,
    answers: clean,
    durationSeconds,
    includeRetrospective: administrationType === "post",
  });

  if (administrationType === "baseline" && !profile.diagnostic_complete) {
    await adminClient
      .from("profiles")
      .update({ diagnostic_complete: true })
      .eq("id", profile.id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/program");
  revalidatePath("/capri/baseline");
  revalidatePath("/capri/post");
  if (administrationType === "post") {
    revalidatePath(`/certificate/${profile.id}`);
  }

  return {
    success: true,
    composite: scored.current.composite,
    band: scored.current.band,
    pillars: scored.current.pillars,
  };
}
