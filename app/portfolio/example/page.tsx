import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  loadPortfolioDocument,
  PORTFOLIO_EXAMPLE_STUDENT_ID,
} from "@/lib/portfolio";
import { PortfolioDocument } from "@/components/portfolio/portfolio-document";

export const metadata: Metadata = {
  title: "Example portfolio",
  description: null,
};

/**
 * Read-only finished example for preview users. Reads another student's work,
 * so it runs under the service role and only ever for the pinned demo fixture,
 * re-checked here to still be a finished demo profile in a demo institution.
 */
export default async function ExamplePortfolioPage() {
  const viewer = await requireProfile();
  if (!viewer.is_demo && viewer.role !== "super_admin") {
    redirect("/profile/portfolio");
  }

  const admin = createAdminClient();
  const { data: example } = await admin
    .from("profiles")
    .select(
      "id, full_name, institution_id, is_demo, program_completed_at, portfolio_selection, institutions!inner(is_demo)"
    )
    .eq("id", PORTFOLIO_EXAMPLE_STUDENT_ID)
    .eq("is_demo", true)
    .eq("institutions.is_demo", true)
    .not("program_completed_at", "is", null)
    .maybeSingle();

  if (!example?.program_completed_at) notFound();

  const data = await loadPortfolioDocument(admin, example, {
    includeAllWork: true,
  });
  if (data.selectedWork.length === 0) notFound();

  return <PortfolioDocument data={data} variant="example" />;
}
