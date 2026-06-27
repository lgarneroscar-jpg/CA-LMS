import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";

type DbClient = SupabaseClient<Database>;

export type NotificationType =
  | "content_unlocked"
  | "rank_up"
  | "rank_down"
  | "streak_milestone"
  | "message"
  | "program_complete";

function getNotificationWriteClient(fallback: DbClient): DbClient {
  try {
    return createAdminClient();
  } catch {
    return fallback;
  }
}

export async function createNotification(
  supabase: DbClient,
  params: {
    userId: string;
    type: NotificationType;
    message: string;
  }
) {
  const client = getNotificationWriteClient(supabase);

  const { error } = await client.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    message: params.message,
    is_read: false,
  });

  if (error) {
    console.error("[createNotification]", error.message);
  }
}

export async function markNotificationRead(
  supabase: DbClient,
  notificationId: string,
  userId: string
) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function getUnreadCount(supabase: DbClient, userId: string) {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) return 0;
  return count ?? 0;
}
