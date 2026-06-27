import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CertificateView } from "@/components/certificate/certificate-view";

type PageProps = {
  params: Promise<{ "student-id": string }>;
};

export default async function CertificatePage({ params }: PageProps) {
  const { "student-id": studentId } = await params;
  const viewer = await requireProfile();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("profiles")
    .select(
      "id, full_name, institution_id, program_completed_at, role"
    )
    .eq("id", studentId)
    .single();

  if (!student?.program_completed_at) notFound();

  const canView =
    viewer.id === studentId ||
    viewer.role === "super_admin" ||
    (viewer.role === "institutional_admin" &&
      viewer.institution_id === student.institution_id);

  if (!canView) notFound();

  const { data: institution } = student.institution_id
    ? await supabase
        .from("institutions")
        .select("name")
        .eq("id", student.institution_id)
        .single()
    : { data: null };

  return (
    <CertificateView
      studentName={student.full_name ?? "Student"}
      institutionName={institution?.name ?? "Corporate Academy"}
      completedAt={student.program_completed_at}
    />
  );
}
