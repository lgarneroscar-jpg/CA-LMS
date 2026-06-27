"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export async function flagStudent(params: {
  institutionId: string;
  studentId: string;
  note: string;
}) {
  const profile = await requireRole(["institutional_admin", "super_admin"]);

  if (
    profile.role === "institutional_admin" &&
    profile.institution_id !== params.institutionId
  ) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("flags").upsert(
    {
      student_id: params.studentId,
      flagged_by: profile.id,
      note: params.note.trim() || null,
    },
    { onConflict: "student_id" }
  );

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/${params.institutionId}/students`);
  revalidatePath(`/admin/${params.institutionId}/dashboard`);
  revalidatePath(
    `/admin/${params.institutionId}/students/${params.studentId}`
  );
  return { success: true };
}

export async function unflagStudent(params: {
  institutionId: string;
  studentId: string;
}) {
  const profile = await requireRole(["institutional_admin", "super_admin"]);

  if (
    profile.role === "institutional_admin" &&
    profile.institution_id !== params.institutionId
  ) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();
  await supabase.from("flags").delete().eq("student_id", params.studentId);

  revalidatePath(`/admin/${params.institutionId}/students`);
  revalidatePath(`/admin/${params.institutionId}/dashboard`);
  return { success: true };
}
