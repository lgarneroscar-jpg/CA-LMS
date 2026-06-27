import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getProgramWeek } from "@/lib/drip";
import { createNotification } from "@/lib/notifications";

type DbClient = SupabaseClient<Database>;

/**
 * Notify a student when new weekly content becomes available.
 * Skips if a notification for this week was already sent.
 */
export async function notifyContentUnlockedIfNeeded(
  supabase: DbClient,
  params: {
    studentId: string;
    cohortStartDate: string | null;
    diagnosticComplete: boolean;
    dripType: string;
    isDemo: boolean;
    isFullyUnlocked: boolean;
  }
) {
  if (params.isDemo || params.isFullyUnlocked || !params.diagnosticComplete) {
    return;
  }

  const currentWeek = getProgramWeek(params.cohortStartDate);
  if (currentWeek <= 0) return;

  const weekMarker = `Week ${currentWeek} content`;
  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", params.studentId)
    .eq("type", "content_unlocked")
    .ilike("message", `%${weekMarker}%`)
    .limit(1);

  if (existing && existing.length > 0) return;

  await createNotification(supabase, {
    userId: params.studentId,
    type: "content_unlocked",
    message: `${weekMarker} is now unlocked. Start your next module!`,
  });
}
