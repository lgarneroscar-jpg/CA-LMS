"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { XP_REWARDS } from "@/lib/xp";

async function assertInstitutionAccess(institutionId: string) {
  const profile = await requireRole(["institutional_admin", "super_admin"]);
  if (
    profile.role === "institutional_admin" &&
    profile.institution_id !== institutionId
  ) {
    throw new Error("Forbidden");
  }
  return profile;
}

export async function saveAdminLiveAttendance(
  institutionId: string,
  sessionModuleId: string,
  attendedStudentIds: string[]
) {
  const profile = await assertInstitutionAccess(institutionId);
  const supabase = await createClient();

  const { data: sessionModule, error: moduleError } = await supabase
    .from("modules")
    .select("id, is_live_session")
    .eq("id", sessionModuleId)
    .single();

  if (moduleError || !sessionModule?.is_live_session) {
    throw new Error("Live session not found");
  }

  const { data: students, error: studentsError } = await supabase
    .from("profiles")
    .select("id")
    .eq("institution_id", institutionId)
    .eq("role", "student");

  if (studentsError) {
    throw new Error(studentsError.message);
  }

  const rosterIds = new Set((students ?? []).map((s) => s.id));
  const attendedSet = new Set(
    attendedStudentIds.filter((id) => rosterIds.has(id))
  );

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    throw new Error("Admin client unavailable");
  }

  for (const studentId of rosterIds) {
    const shouldAttend = attendedSet.has(studentId);

    const { data: existing } = await admin
      .from("student_progress")
      .select("id, is_complete, attendance_source, xp_earned")
      .eq("student_id", studentId)
      .eq("module_id", sessionModuleId)
      .maybeSingle();

    if (shouldAttend) {
      if (existing?.is_complete && existing.attendance_source === "admin_confirmed") {
        continue;
      }

      const xpEarned =
        existing?.is_complete && existing.xp_earned > 0
          ? existing.xp_earned
          : XP_REWARDS.liveSessionAttendance;

      if (!existing) {
        await admin.from("student_progress").insert({
          student_id: studentId,
          module_id: sessionModuleId,
          is_complete: true,
          completed_at: new Date().toISOString(),
          xp_earned: xpEarned,
          video_watched: true,
          attendance_source: "admin_confirmed",
          attendance_confirmed_by: profile.id,
        });

        const { data: studentProfile } = await admin
          .from("profiles")
          .select("xp")
          .eq("id", studentId)
          .single();

        await admin
          .from("profiles")
          .update({ xp: (studentProfile?.xp ?? 0) + xpEarned })
          .eq("id", studentId);
      } else {
        const wasComplete = existing.is_complete;
        await admin
          .from("student_progress")
          .update({
            is_complete: true,
            completed_at: new Date().toISOString(),
            attendance_source: "admin_confirmed",
            attendance_confirmed_by: profile.id,
            xp_earned: wasComplete ? existing.xp_earned : xpEarned,
            video_watched: true,
          })
          .eq("id", existing.id);

        if (!wasComplete) {
          const { data: studentProfile } = await admin
            .from("profiles")
            .select("xp")
            .eq("id", studentId)
            .single();
          await admin
            .from("profiles")
            .update({ xp: (studentProfile?.xp ?? 0) + xpEarned })
            .eq("id", studentId);
        }
      }
    } else if (
      existing?.is_complete &&
      existing.attendance_source === "admin_confirmed"
    ) {
      await admin
        .from("student_progress")
        .update({
          is_complete: false,
          completed_at: null,
          attendance_source: null,
          attendance_confirmed_by: null,
        })
        .eq("id", existing.id);
    }
  }

  revalidatePath(`/admin/${institutionId}/dashboard`);
  revalidatePath(`/admin/${institutionId}/attendance`);
  revalidatePath(`/admin/${institutionId}/attendance/${sessionModuleId}`);
  revalidatePath(`/admin/${institutionId}/students`);

  return { success: true };
}

export async function getAdminLiveAttendanceState(
  institutionId: string,
  sessionModuleId: string
) {
  await assertInstitutionAccess(institutionId);
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("institution_id", institutionId)
    .eq("role", "student")
    .order("full_name");

  const studentIds = (students ?? []).map((s) => s.id);
  if (studentIds.length === 0) {
    return {
      students: [],
      attendanceByStudent: {} as Record<
        string,
        { attended: boolean; source: string | null }
      >,
    };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    admin = supabase;
  }

  const { data: progressRows } = await admin
    .from("student_progress")
    .select("student_id, is_complete, attendance_source")
    .eq("module_id", sessionModuleId)
    .in("student_id", studentIds);

  const attendanceByStudent: Record<
    string,
    { attended: boolean; source: string | null }
  > = {};

  for (const student of students ?? []) {
    const row = progressRows?.find((p) => p.student_id === student.id);
    attendanceByStudent[student.id] = {
      attended: Boolean(row?.is_complete),
      source: row?.attendance_source ?? null,
    };
  }

  return {
    students: students ?? [],
    attendanceByStudent,
  };
}
