import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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

export default async function InstitutionReportsPage({ params }: PageProps) {
  const { "institution-id": institutionId } = await params;
  await requireRole(["super_admin"]);
  const supabase = await createClient();

  const { data: institution } = await supabase
    .from("institutions")
    .select("name, reporting_cadence")
    .eq("id", institutionId)
    .single();

  if (!institution) notFound();

  const { data: reports } = await supabase
    .from("reports")
    .select("id, period_start, period_end, created_at")
    .eq("institution_id", institutionId)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/superadmin/institutions"
          className="text-sm text-muted-foreground underline"
        >
          ← Institutions
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{institution.name} reports</h1>
        <p className="text-muted-foreground">
          Automated snapshots every{" "}
          {institution.reporting_cadence.replace("weeks", " weeks")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historical snapshots</CardTitle>
          <CardDescription>
            Generated when admins load the institution dashboard after each
            reporting period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!reports?.length ? (
            <p className="text-sm text-muted-foreground">No reports yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {reports.map((report) => (
                <li key={report.id} className="flex justify-between py-3">
                  <span>
                    {report.period_start} → {report.period_end}
                  </span>
                  <span className="text-muted-foreground">
                    Saved {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
