"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  parsePortfolioSelection,
  portfolioSelectionKey,
} from "@/lib/portfolio-selection";

export type SavePortfolioSelectionResult =
  | { ok: true; selection: string[] }
  | { ok: false; error: string };

/**
 * Stores which saved exercises go into the student's portfolio document.
 * Independent of exercise_answers.is_public, which this never reads or writes.
 */
export async function savePortfolioSelection(
  keys: string[]
): Promise<SavePortfolioSelectionResult> {
  const profile = await requireRole(["student"]);
  if (!profile.program_completed_at) {
    return {
      ok: false,
      error: "Your portfolio unlocks when you complete the program.",
    };
  }

  const supabase = await createClient();
  const { data: answers, error: answersError } = await supabase
    .from("exercise_answers")
    .select("module_id, exercise_key")
    .eq("user_id", profile.id);

  if (answersError) {
    return { ok: false, error: "Couldn't save your selection. Try again." };
  }

  const owned = new Set(
    (answers ?? []).map((row) =>
      portfolioSelectionKey(row.module_id, row.exercise_key)
    )
  );
  const selection = parsePortfolioSelection(keys).filter((key) => owned.has(key));

  // profiles UPDATE is column-granted to students (S6) and this column is not
  // in that grant, so the write goes through the service role, keyed to the
  // session's own id.
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ portfolio_selection: selection })
    .eq("id", profile.id);

  if (error) {
    console.error("[savePortfolioSelection]", error.message);
    return { ok: false, error: "Couldn't save your selection. Try again." };
  }

  revalidatePath("/profile/portfolio");
  revalidatePath("/portfolio");
  return { ok: true, selection };
}
