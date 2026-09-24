import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { hasSubmittedPost } from "@/lib/capri/queries";
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

  // The certificate is gated on the Week 12 CAPRI. Without a paired post
  // response there is no outcome to report to the institution, so completing
  // the assessment is part of completing the program.
  const postComplete = await hasSubmittedPost(supabase, studentId);
  if (!postComplete) {
    if (viewer.id === studentId) redirect("/capri/post");
    notFound();
  }

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
