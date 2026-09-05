import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { fetchCapriOutcomes } from "@/lib/capri-outcomes";
import { computeReportDeltas } from "@/lib/report-deltas";
import { loadPreviousReport, loadReportRow } from "@/lib/reports";
import { createClient } from "@/lib/supabase/server";
import { InstitutionReportArtifact } from "@/components/admin/institution-report-artifact";
import { PrintReportButton } from "@/components/admin/print-report-button";

type PageProps = {
  params: Promise<{ "institution-id": string; "report-id": string }>;
};

export default async function AdminReportDetailPage({ params }: PageProps) {
  const { "institution-id": institutionId, "report-id": reportId } =
    await params;
  const profile = await requireRole(["institutional_admin", "super_admin"]);

  if (
    profile.role === "institutional_admin" &&
    profile.institution_id !== institutionId
  ) {
    return null;
  }

  const supabase = await createClient();
  const { data: institution } = await supabase
    .from("institutions")
    .select("name")
    .eq("id", institutionId)
    .single();

  if (!institution) notFound();

  const report = await loadReportRow(institutionId, reportId);
  if (!report) notFound();

  const previous = await loadPreviousReport(institutionId, report.period_end);
  const deltas = computeReportDeltas(
    report.envelope,
    previous?.envelope ?? null
  );
  const capri = await fetchCapriOutcomes({
    institutionId,
    periodStart: report.period_start,
    periodEnd: report.period_end,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/admin/${institutionId}/reports`}
          className="text-sm text-muted-foreground underline"
        >
          ← All reports
        </Link>
        <PrintReportButton />
      </div>

      <InstitutionReportArtifact
        institutionName={institution.name}
        periodStart={report.period_start}
        periodEnd={report.period_end}
        envelope={report.envelope}
        deltas={deltas}
        capri={capri}
      />
    </div>
  );
}
