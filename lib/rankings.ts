import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createNotification } from "@/lib/notifications";

type DbClient = SupabaseClient<Database>;

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function formatRankMessage(rank: number): string {
  return `You're ranked ${ordinal(rank)} in your cohort.`;
}

export async function recalculateCohortRanksAndNotify(
  supabase: DbClient,
  params: {
    institutionId: string;
    studentId: string;
  }
) {
  const { data: before } = await supabase
    .from("profiles")
    .select("rank")
    .eq("id", params.studentId)
    .single();

  const oldRank = before?.rank ?? null;

  const { error: rpcError } = await supabase.rpc("recalculate_cohort_ranks", {
    p_institution_id: params.institutionId,
  });

  if (rpcError) {
    console.error("[recalculateCohortRanks]", rpcError.message);
    return;
  }

  const { data: after } = await supabase
    .from("profiles")
    .select("rank")
    .eq("id", params.studentId)
    .single();

  const newRank = after?.rank ?? null;
  if (oldRank === null || newRank === null || oldRank === newRank) return;

  if (newRank < oldRank) {
    await createNotification(supabase, {
      userId: params.studentId,
      type: "rank_up",
      message: `You moved up to ${ordinal(newRank)} place in your cohort.`,
    });
  } else {
    await createNotification(supabase, {
      userId: params.studentId,
      type: "rank_down",
      message: `Your cohort rank changed to ${ordinal(newRank)} place.`,
    });
  }
}
