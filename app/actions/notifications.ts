"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { markNotificationRead } from "@/lib/notifications";

export async function markNotificationAsRead(notificationId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  await markNotificationRead(supabase, notificationId, profile.id);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markAllNotificationsRead() {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", profile.id)
    .eq("is_read", false);
  revalidatePath("/dashboard");
  return { success: true };
}
