import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { countInstitutionReports } from "@/app/actions/institutions";
import { getInstitutionRoster } from "@/app/actions/roster-invites";
import { InstitutionForm } from "@/components/superadmin/institution-form";
import { RosterTable } from "@/components/superadmin/roster-table";
import { RosterUpload } from "@/components/superadmin/roster-upload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  params: Promise<{ "institution-id": string }>;
};

export default async function InstitutionDetailPage({ params }: Props) {
  await requireRole(["super_admin"]);
  const { "institution-id": institutionId } = await params;
  const supabase = await createClient();

  const { data: institution, error } = await supabase
    .from("institutions")
    .select(
      "id, name, cohort_start_date, reporting_cadence, drip_type, is_pilot, logo_url, primary_color, notes, is_fully_unlocked"
    )
    .eq("id", institutionId)
    .single();

  if (error || !institution) notFound();

  const [reportCount, roster] = await Promise.all([
    countInstitutionReports(institutionId),
    getInstitutionRoster(institutionId),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {institution.name}
            </h1>
            {institution.is_pilot ? (
              <Badge variant="secondary">Pilot</Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground">
            Edit settings and manage the student roster.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/superadmin/institutions/${institutionId}/reports`}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
          >
            Reports
          </Link>
          <Link
            href="/superadmin/institutions"
            className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
          >
            All institutions
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Institution settings</CardTitle>
          <CardDescription>
            Changing cohort start date on a live cohort moves every future report
            period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InstitutionForm
            mode="edit"
            institutionId={institution.id}
            existingReportCount={reportCount}
            initial={{
              name: institution.name,
              cohort_start_date: institution.cohort_start_date ?? "",
              reporting_cadence: institution.reporting_cadence,
              drip_type: institution.drip_type,
              is_pilot: institution.is_pilot,
              logo_url: institution.logo_url ?? "",
              primary_color: institution.primary_color ?? "",
              notes: institution.notes ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roster</CardTitle>
          <CardDescription>
            Invited · Accepted · Not yet accepted — status is derived from auth
            sign-in, not a maintained flag. Students set their own password via
            the invite link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <RosterTable institutionId={institutionId} students={roster} />
          <div className="border-t pt-6">
            <h3 className="mb-3 text-sm font-semibold">Invite more students</h3>
            <RosterUpload institutionId={institutionId} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
