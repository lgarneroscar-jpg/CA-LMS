import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function InstitutionsPage() {
  await requireRole(["super_admin"]);
  const supabase = await createClient();

  const { data: institutions } = await supabase
    .from("institutions")
    .select("id, name, cohort_start_date, is_pilot, reporting_cadence, drip_type")
    .order("name");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Institutions</h1>
          <p className="text-muted-foreground">
            Create and manage partner institutions and their rosters.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/superadmin/institutions/new"
            className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create institution
          </Link>
          <Link
            href="/superadmin"
            className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
          >
            Overview
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Institution list</CardTitle>
          <CardDescription>
            {institutions?.length ?? 0} institution(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {institutions && institutions.length > 0 ? (
            <ul className="divide-y divide-border">
              {institutions.map((inst) => (
                <li
                  key={inst.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{inst.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {inst.is_pilot ? "Pilot" : "Active"}
                      {inst.cohort_start_date
                        ? ` · Cohort starts ${inst.cohort_start_date}`
                        : ""}
                      {` · ${inst.drip_type} · ${inst.reporting_cadence}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {inst.is_pilot ? (
                      <Badge variant="secondary">Pilot</Badge>
                    ) : null}
                    <Link
                      href={`/admin/${inst.id}/dashboard`}
                      className="text-sm font-medium text-accent underline hover:text-accent/80"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href={`/superadmin/institutions/${inst.id}`}
                      className="text-sm font-medium text-accent underline hover:text-accent/80"
                    >
                      Manage
                    </Link>
                    <Link
                      href={`/superadmin/institutions/${inst.id}/reports`}
                      className="text-sm font-medium text-muted-foreground underline hover:text-foreground"
                    >
                      Reports
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No institutions yet.{" "}
              <Link
                href="/superadmin/institutions/new"
                className="underline hover:text-foreground"
              >
                Create the first one
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
