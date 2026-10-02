import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { pluralize } from "@/lib/admin-reporting";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/types/index";
import type { UserRole } from "@/types/index";

export default async function UsersPage() {
  await requireRole(["super_admin"]);
  const supabase = await createClient();

  const [{ data: users }, { data: institutions }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, institution_id, xp")
      .order("role")
      .order("full_name"),
    supabase.from("institutions").select("id, name"),
  ]);

  const institutionName = new Map(
    (institutions ?? []).map((inst) => [inst.id, inst.name])
  );

  const unassignedStudents = (users ?? []).filter(
    (u) => u.role === "student" && !u.institution_id
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-muted-foreground">All platform users by role.</p>
        </div>
        <Link
          href="/superadmin"
          className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
        >
          Back to overview
        </Link>
      </div>

      {unassignedStudents.length > 0 ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">
            {unassignedStudents.length}{" "}
            {pluralize(unassignedStudents.length, "student")} not assigned to a
            cohort
          </p>
          <p className="mt-1">
            They can sign in but see only a &ldquo;not assigned to a cohort&rdquo;
            page — no modules or CAPRI. This usually means they were invited from
            the Supabase dashboard instead of an institution roster, or their
            institution was removed. Set <code>profiles.institution_id</code> to
            place them in a cohort.
          </p>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>User directory</CardTitle>
          <CardDescription>
            {users?.length ?? 0} {pluralize(users?.length ?? 0, "user")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <ul className="divide-y divide-border">
              {users.map((user) => {
                const unassigned =
                  user.role === "student" && !user.institution_id;
                const instName = user.institution_id
                  ? institutionName.get(user.institution_id) ?? "Unknown institution"
                  : null;
                return (
                  <li
                    key={user.id}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{user.full_name ?? "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{user.id.slice(0, 8)}…</span>
                        {instName ? (
                          <>
                            {" · "}
                            <Link
                              href={`/superadmin/institutions/${user.institution_id}`}
                              className="underline hover:text-foreground"
                            >
                              {instName}
                            </Link>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {unassigned ? (
                        <Badge className="border-amber-300 bg-amber-100 text-amber-900">
                          No cohort
                        </Badge>
                      ) : null}
                      <Badge variant="secondary">
                        {ROLE_LABELS[user.role as UserRole]}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No users yet. Invite students from an institution roster.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
