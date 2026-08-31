import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getAdminLiveAttendanceState } from "@/app/actions/admin-attendance";
import { AdminAttendanceEditor } from "@/components/admin/admin-attendance-editor";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PageProps = {
  params: Promise<{ "institution-id": string; "session-id": string }>;
};

export default async function AdminSessionAttendancePage({ params }: PageProps) {
  const { "institution-id": institutionId, "session-id": sessionId } =
    await params;
  await requireRole(["institutional_admin", "super_admin"]);

  const supabase = await createClient();
  const { data: sessionModule } = await supabase
    .from("modules")
    .select("id, module_code, title, is_live_session")
    .eq("id", sessionId)
    .single();

  if (!sessionModule?.is_live_session) notFound();

  const { students, attendanceByStudent } = await getAdminLiveAttendanceState(
    institutionId,
    sessionId
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/admin/${institutionId}/attendance`}
          className="text-sm text-muted-foreground underline"
        >
          ← All sessions
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">
          {sessionModule.module_code} · {sessionModule.title}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Institution roster</CardTitle>
          <CardDescription>
            Check students who attended. Saving marks them as admin-confirmed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminAttendanceEditor
            institutionId={institutionId}
            sessionModuleId={sessionId}
            sessionLabel={sessionModule.module_code}
            students={students}
            initialAttendance={attendanceByStudent}
          />
        </CardContent>
      </Card>
    </div>
  );
}
