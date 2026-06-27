import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createNotification } from "@/lib/notifications";
import { sendBehindPaceEmail } from "@/lib/email";
import { getExpectedWeek, getPaceStatus } from "@/lib/pace";

type DbClient = SupabaseClient<Database>;

/**
 * Notify and email when a student falls behind their personal program pace.
 * Deduped once per expected week.
 */
export async function notifyBehindPaceIfNeeded(
  supabase: DbClient,
  params: {
    studentId: string;
    studentEmail: string | null;
    studentName: string | null;
    programStartedAt: string | null;
    progressWeek: number;
  }
) {
  if (!params.programStartedAt) return;

  const status = getPaceStatus(params.programStartedAt, params.progressWeek);
  if (status !== "behind") return;

  const expectedWeek = getExpectedWeek(params.programStartedAt);
  const marker = `behind pace week ${expectedWeek}`;

  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", params.studentId)
    .eq("type", "message")
    .ilike("message", `%${marker}%`)
    .limit(1);

  if (existing && existing.length > 0) return;

  const message = `You're a week behind pace — your next module is waiting. (${marker})`;

  await createNotification(supabase, {
    userId: params.studentId,
    type: "message",
    message,
  });

  if (params.studentEmail) {
    await sendBehindPaceEmail({
      to: params.studentEmail,
      studentName: params.studentName ?? "Student",
      progressWeek: params.progressWeek,
      expectedWeek,
    });
  }
}
