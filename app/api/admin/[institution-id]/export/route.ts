import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCohortAnalytics } from "@/lib/cohort-analytics";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteParams = { params: Promise<{ "institution-id": string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { "institution-id": institutionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, institution_id")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    (profile.role !== "super_admin" &&
      (profile.role !== "institutional_admin" ||
        profile.institution_id !== institutionId))
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    admin = supabase;
  }

  const analytics = await getCohortAnalytics(admin, institutionId);
  if (!analytics) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const emailMap = new Map<string, string>();
  for (const student of analytics.allStudents) {
    const { data } = await admin.auth.admin.getUserById(student.id);
    emailMap.set(student.id, data.user?.email ?? "");
  }

  const header = [
    "name",
    "email",
    "completion_percent",
    "xp",
    "rank",
    "quiz_average",
    "last_login",
    "flag_status",
  ];

  const rows = analytics.allStudents.map((s) => [
    s.full_name ?? "",
    emailMap.get(s.id) ?? "",
    String(s.completionPercent),
    String(s.xp),
    s.rank != null ? String(s.rank) : "",
    String(s.quizAverage),
    s.last_login ?? "",
    s.hasFlag ? "flagged" : "",
  ]);

  const csv = [header, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="cohort-${institutionId}.csv"`,
    },
  });
}
