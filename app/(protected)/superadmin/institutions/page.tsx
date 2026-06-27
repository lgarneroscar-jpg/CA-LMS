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

export default async function InstitutionsPage() {
  await requireRole(["super_admin"]);
  const supabase = await createClient();

  const { data: institutions } = await supabase
    .from("institutions")
    .select("id, name, cohort_start_date, is_pilot")
    .order("name");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Institutions</h1>
          <p className="text-muted-foreground">
            All partner institutions on the platform.
          </p>
        </div>
        <Link
          href="/superadmin"
          className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
        >
          Back to overview
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Institution list</CardTitle>
          <CardDescription>
            {institutions?.length ?? 0} institution(s) — add via Supabase for now
          </CardDescription>
        </CardHeader>
        <CardContent>
          {institutions && institutions.length > 0 ? (
            <ul className="divide-y divide-border">
              {institutions.map((inst) => (
                <li
                  key={inst.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{inst.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {inst.is_pilot ? "Pilot" : "Active"}
                      {inst.cohort_start_date
                        ? ` · Cohort starts ${inst.cohort_start_date}`
                        : ""}
                    </p>
                  </div>
                  <Link
                    href={`/superadmin/institutions/${inst.id}/reports`}
                    className="text-sm font-medium text-accent underline hover:text-accent/80"
                  >
                    Reports
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No institutions yet. Insert a row in the{" "}
              <code className="rounded bg-muted px-1">institutions</code> table in
              Supabase.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
