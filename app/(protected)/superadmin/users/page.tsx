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
import { ROLE_LABELS } from "@/types/index";
import type { UserRole } from "@/types/index";

export default async function UsersPage() {
  await requireRole(["super_admin"]);
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, role, institution_id, xp")
    .order("role")
    .order("full_name");

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

      <Card>
        <CardHeader>
          <CardTitle>User directory</CardTitle>
          <CardDescription>{users?.length ?? 0} user(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <ul className="divide-y divide-border">
              {users.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{user.full_name ?? "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {user.id.slice(0, 8)}…
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {ROLE_LABELS[user.role as UserRole]}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No users yet. Create auth users in Supabase with role metadata.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
