import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  fetchActiveItems,
  fetchAnswers,
  findResponse,
  type AdministrationType,
} from "@/lib/capri/queries";
import { CapriAssessment } from "@/components/capri/capri-assessment";

type PageProps = {
  params: Promise<{ administration: string }>;
};

const VALID: AdministrationType[] = ["baseline", "post"];

export default async function CapriPage({ params }: PageProps) {
  const { administration } = await params;

  if (!VALID.includes(administration as AdministrationType)) notFound();
  const administrationType = administration as AdministrationType;

  const profile = await requireRole(["student"]);

  if (!profile.onboarding_complete && !profile.is_demo) {
    redirect("/onboarding");
  }

  if (!profile.institution_id) {
    redirect("/dashboard");
  }

  // The Week 12 post unlocks off the same signal that drives the certificate:
  // all content modules complete.
  if (administrationType === "post" && !profile.program_completed_at) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const existing = await findResponse(
    supabase,
    profile.institution_id,
    profile.id,
    administrationType
  );

  if (existing?.submittedAt) {
    redirect("/dashboard");
  }

  const [items, answers] = await Promise.all([
    fetchActiveItems(supabase),
    existing ? fetchAnswers(supabase, existing.id) : Promise.resolve([]),
  ]);

  if (items.length === 0) {
    throw new Error(
      "CAPRI items are not seeded. Run the capri_v2_instrument migration."
    );
  }

  return (
    <CapriAssessment
      administrationType={administrationType}
      items={items}
      savedAnswers={answers}
    />
  );
}
