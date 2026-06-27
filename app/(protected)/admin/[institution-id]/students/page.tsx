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
import { Badge } from "@/components/ui/badge";

type PageProps = {
  params: Promise<{ "institution-id": string }>;
};

export default async function AdminStudentsPage({ params }: PageProps) {
  const { "institution-id": institutionId } = await params;
  await requireRole(["institutional_admin", "super_admin"]);
  const supabase = await createClient();
  const analytics = await getCohortAnalytics(supabase, institutionId);

  const students = analytics?.allStudents ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Student roster</h1>
          <p className="text-muted-foreground">
            {students.length} student(s) · click a name for full detail
          </p>
        </div>
        <a
          href={`/api/admin/${institutionId}/export`}
          className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
        >
          Export CSV
        </a>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roster</CardTitle>
          <CardDescription>Sorted by XP · flagged students highlighted</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">XP</th>
                    <th className="py-2 pr-4">Rank</th>
                    <th className="py-2 pr-4">Completion</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...students]
                    .sort((a, b) => b.xp - a.xp)
                    .map((s) => (
                      <tr
                        key={s.id}
                        className={
                          s.hasFlag
                            ? "border-b border-amber-200 bg-amber-50/50"
                            : "border-b border-border/60"
                        }
                      >
                        <td className="py-2 pr-4">
                          <Link
                            href={`/admin/${institutionId}/students/${s.id}`}
                            className="font-medium hover:underline"
                          >
                            {s.full_name ?? "Unnamed"}
                          </Link>
                        </td>
                        <td className="py-2 pr-4">{s.xp}</td>
                        <td className="py-2 pr-4">{s.rank ?? "—"}</td>
                        <td className="py-2 pr-4">{s.completionPercent}%</td>
                        <td className="py-2">
                          {s.hasFlag ? (
                            <Badge variant="destructive">Flagged</Badge>
                          ) : s.isBehindPace ? (
                            <Badge variant="outline">Behind pace</Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
