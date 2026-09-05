import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseSnapshotEnvelope } from "@/lib/reports";
import { GenerateReportButton } from "@/components/admin/generate-report-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PageProps = {
  params: Promise<{ "institution-id": string }>;
};

export default async function AdminReportsPage({ params }: PageProps) {
  const { "institution-id": institutionId } = await params;
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
    .select("name, reporting_cadence, cohort_start_date")
    .eq("id", institutionId)
    .single();

  if (!institution) notFound();

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    admin = supabase;
  }

  const { data: reports } = await admin
    .from("reports")
    .select("id, period_start, period_end, created_at, snapshot")
    .eq("institution_id", institutionId)
    .order("period_end", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={`/admin/${institutionId}/dashboard`}
          className="text-sm text-muted-foreground underline"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{institution.name} reports</h1>
        <p className="text-muted-foreground">
          Cadence: every{" "}
          {institution.reporting_cadence.replace("weeks", " weeks")} · periods
          derive from cohort start
          {institution.cohort_start_date
            ? ` (${institution.cohort_start_date})`
            : ""}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate snapshot</CardTitle>
          <CardDescription>
            Explicit action only — loading the dashboard never writes reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GenerateReportButton institutionId={institutionId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historical snapshots</CardTitle>
          <CardDescription>
            Open a period to view the sendable report artifact
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!reports?.length ? (
            <p className="text-sm text-muted-foreground">No reports yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {reports.map((report) => {
                const envelope = parseSnapshotEnvelope(report.snapshot);
                return (
                  <li
                    key={report.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {report.period_start} → {report.period_end}
                      </p>
                      <p className="text-muted-foreground">
                        Saved{" "}
                        {new Date(report.created_at).toLocaleDateString()}
                        {envelope
                          ? ` · ${envelope.completionDefinition} · ${envelope.generatedBy}`
                          : " · legacy snapshot"}
                      </p>
                    </div>
                    <Link
                      href={`/admin/${institutionId}/reports/${report.id}`}
                      className="inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted"
                    >
                      Open report
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
