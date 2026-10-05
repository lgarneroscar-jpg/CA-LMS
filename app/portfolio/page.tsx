import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadPortfolioDocument } from "@/lib/portfolio";
import { PortfolioDocument } from "@/components/portfolio/portfolio-document";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await requireRole(["student"]);
  const name = profile.full_name?.trim() || "Student";
  // Browsers use the title as the default PDF filename.
  return { title: `${name} – Portfolio`, description: null };
}

/**
 * The student's own printable portfolio. Outside the (protected) group so no
 * app chrome renders. Same completion gate as the certificate.
 */
export default async function PortfolioDocumentPage() {
  const profile = await requireRole(["student"]);
  if (!profile.program_completed_at) redirect("/profile/portfolio");

  const supabase = await createClient();
  const data = await loadPortfolioDocument(supabase, {
    id: profile.id,
    full_name: profile.full_name,
    institution_id: profile.institution_id,
    program_completed_at: profile.program_completed_at,
    portfolio_selection: profile.portfolio_selection,
  });

  if (data.selectedWork.length === 0) redirect("/profile/portfolio");

  return <PortfolioDocument data={data} />;
}
