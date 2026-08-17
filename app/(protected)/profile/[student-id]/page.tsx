import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchWorkbookPortfolio } from "@/lib/profile-workbook";
import { LivingWorkbookSection } from "@/components/profile/living-workbook-section";
import { ProfileIdentityHeader } from "@/components/profile/profile-identity-header";

type PageProps = {
  params: Promise<{ "student-id": string }>;
};

export default async function StudentProfilePage({ params }: PageProps) {
  const { "student-id": studentId } = await params;
  const viewer = await requireProfile();

  if (viewer.id === studentId) {
    redirect("/profile");
  }

  const supabase = await createClient();

  const { data: student, error } = await supabase
    .from("profiles")
    .select("id, full_name, bio, profile_picture_url, institution_id, role")
    .eq("id", studentId)
    .maybeSingle();

  if (error || !student) {
    notFound();
  }

  const { data: institution } = student.institution_id
    ? await supabase
        .from("institutions")
        .select("name")
        .eq("id", student.institution_id)
        .maybeSingle()
    : { data: null };

  const workbookPillars = await fetchWorkbookPortfolio(supabase, studentId, {
    publicOnly: true,
  });

  return (
    <div className="experience-lift mx-auto max-w-3xl space-y-8 pb-12">
      <ProfileIdentityHeader
        fullName={student.full_name}
        institutionName={institution?.name ?? null}
        profilePictureUrl={student.profile_picture_url}
        bio={student.bio}
        eyebrow="Public profile"
      />

      <LivingWorkbookSection
        pillars={workbookPillars}
        sectionTitle="Living Workbook"
        sectionDescription="Public exercise responses from this student's program journey."
        emptyTitle="No public workbook entries yet"
        emptyDescription="This student hasn't shared any workbook answers publicly."
        showEmptyProgramLink={false}
      />
    </div>
  );
}
