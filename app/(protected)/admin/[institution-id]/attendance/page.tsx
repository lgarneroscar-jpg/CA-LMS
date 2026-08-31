import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCohortAnalytics } from "@/lib/cohort-analytics";
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

export default async function AdminAttendanceIndexPage({ params }: PageProps) {
  const { "institution-id": institutionId } = await params;
  await requireRole(["institutional_admin", "super_admin"]);

  const supabase = await createClient();
  const analytics = await getCohortAnalytics(supabase, institutionId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={`/admin/${institutionId}/dashboard`}
          className="text-sm text-muted-foreground underline"
        >
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Live session attendance</h1>
        <p className="text-muted-foreground">
          Confirm attendance per session. Admin-confirmed records override
          self-reported marks in reporting.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>
            Self-reported attendance is never shown as verified
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {(analytics?.liveSessionAttendanceRates ?? []).map((session) => (
              <li
                key={session.sessionId}
                className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {session.moduleCode} · {session.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {session.summaryLabel}
                  </p>
                </div>
                <Link
                  href={`/admin/${institutionId}/attendance/${session.sessionId}`}
                  className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
                >
                  Manage roster
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
