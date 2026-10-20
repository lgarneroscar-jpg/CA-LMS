import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Whether marking an answer public can reach anyone. Not in a demo institution
 * (trg_force_private_in_demo resets is_public there) and not without an
 * institution (the cohort read policy then matches nobody). Where this is
 * false the UI offers no sharing control at all.
 */
export async function isAnswerSharingAvailable(
  supabase: SupabaseClient<Database>,
  institutionId: string | null
): Promise<boolean> {
  if (!institutionId) return false;
  const { data } = await supabase
    .from("institutions")
    .select("is_demo")
    .eq("id", institutionId)
    .maybeSingle();
  return data ? !data.is_demo : false;
}
