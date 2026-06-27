import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LiveSessionEditor } from "@/components/superadmin/live-session-editor";

export default async function LiveSessionsAdminPage() {
  await requireRole(["super_admin"]);
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("modules")
    .select(
      "id, module_code, title, description, unlock_week, stream_url, recording_url"
    )
    .eq("is_live_session", true)
    .order("unlock_week");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Live sessions</h1>
          <p className="text-muted-foreground">
            Manage stream URLs and post-session recordings.
          </p>
        </div>
        <Link
          href="/superadmin/content"
          className="inline-flex h-7 items-center rounded-lg bg-secondary px-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
        >
          ← Modules
        </Link>
      </div>
      <LiveSessionEditor sessions={sessions ?? []} />
    </div>
  );
}
