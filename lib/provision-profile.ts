import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type AdminClient = SupabaseClient<Database>;

export type ProvisionedRole = "student" | "institutional_admin";

/**
 * Sets role and institution on a profile created by an admin action. The
 * handle_new_user trigger deliberately ignores sign-up metadata for both —
 * anyone can supply metadata through a public sign-up — so these values must
 * come from here, using the service-role client, with the caller already
 * authorised.
 */
export async function provisionProfile(
  admin: AdminClient,
  params: {
    userId: string;
    role: ProvisionedRole;
    institutionId: string | null;
    fullName: string | null;
    /** Set only at roster enrolment. Omit to leave an existing flag untouched. */
    under18AtEnrollment?: boolean;
  }
): Promise<{ error: string | null }> {
  const { error } = await admin.from("profiles").upsert(
    {
      id: params.userId,
      role: params.role,
      institution_id: params.institutionId,
      full_name: params.fullName,
      ...(params.under18AtEnrollment === undefined
        ? {}
        : { under_18_at_enrollment: params.under18AtEnrollment }),
    },
    { onConflict: "id" }
  );
  return { error: error?.message ?? null };
}
