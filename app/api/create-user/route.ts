import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreateUserBody = {
  email: string;
  password: string;
  full_name?: string;
  role?: "student" | "institutional_admin" | "super_admin";
  institution_id?: string | null;
  is_demo?: boolean;
  /** Delete existing auth user with this email before creating */
  recreate?: boolean;
  /** Apply demo seed progress after create (P1 complete, P2 in progress) */
  seed_demo_progress?: boolean;
};

function authorizeRequest(request: Request): boolean {
  const secret = process.env.CREATE_USER_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  return authHeader.slice("Bearer ".length) === secret;
}

async function findUserIdByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string
): Promise<string | null> {
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);

    const match = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (match) return match.id;

    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

async function seedDemoProgress(
  admin: ReturnType<typeof createAdminClient>,
  studentId: string
) {
  const { data: modules } = await admin
    .from("modules")
    .select("id, module_code")
    .in("module_code", ["P1", "P2"]);

  const p1 = modules?.find((m) => m.module_code === "P1");
  const p2 = modules?.find((m) => m.module_code === "P2");

  const { data: institution } = await admin
    .from("institutions")
    .select("id")
    .eq("name", "Demo Preview")
    .maybeSingle();

  await admin
    .from("profiles")
    .update({
      institution_id: institution?.id ?? null,
      role: "student",
      is_demo: true,
      full_name: "Demo Student",
      xp: 280,
      streak_days: 12,
      last_active_date: new Date().toISOString().slice(0, 10),
      onboarding_complete: true,
      diagnostic_complete: true,
      rank: 2,
    })
    .eq("id", studentId);

  if (p1) {
    await admin.from("student_progress").upsert(
      {
        student_id: studentId,
        module_id: p1.id,
        video_watched: true,
        exercises_submitted: true,
        quiz_completed: true,
        quiz_score: 5,
        is_complete: true,
        completed_at: new Date().toISOString(),
        xp_earned: 140,
      },
      { onConflict: "student_id,module_id" }
    );

    await admin.from("exercise_responses").upsert(
      [
        {
          student_id: studentId,
          module_id: p1.id,
          exercise_key: "identity_statement",
          response:
            "I am becoming a strategic communicator who builds trust early in my career.",
        },
        {
          student_id: studentId,
          module_id: p1.id,
          exercise_key: "signal_gap",
          response:
            "I want to be seen as proactive, but I sometimes wait to be asked before sharing ideas.",
        },
        {
          student_id: studentId,
          module_id: p1.id,
          exercise_key: "mindset_shift",
          response: "From passive to proactive outreach",
        },
        {
          student_id: studentId,
          module_id: p1.id,
          exercise_key: "action_commitment",
          response: "true",
        },
      ],
      { onConflict: "student_id,module_id,exercise_key" }
    );
  }

  if (p2) {
    await admin.from("student_progress").upsert(
      {
        student_id: studentId,
        module_id: p2.id,
        video_watched: true,
        exercises_submitted: true,
        quiz_completed: false,
        is_complete: false,
        xp_earned: 0,
      },
      { onConflict: "student_id,module_id" }
    );
  }
}

export async function POST(request: Request) {
  if (!authorizeRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateUserBody;
  try {
    body = (await request.json()) as CreateUserBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: "email and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "password must be at least 8 characters" },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();

    if (body.recreate) {
      const existingId = await findUserIdByEmail(admin, email);
      if (existingId) {
        const { error: deleteError } = await admin.auth.admin.deleteUser(
          existingId
        );
        if (deleteError) throw new Error(deleteError.message);
      }
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: body.role ?? "student",
        full_name: body.full_name ?? email.split("@")[0],
        institution_id: body.institution_id ?? null,
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("User creation returned no user");

    const userId = data.user.id;

    if (body.is_demo || body.seed_demo_progress) {
      await seedDemoProgress(admin, userId);
    } else if (body.role || body.institution_id || body.full_name) {
      await admin
        .from("profiles")
        .update({
          role: body.role ?? "student",
          full_name: body.full_name ?? null,
          institution_id: body.institution_id ?? null,
          is_demo: body.is_demo ?? false,
        })
        .eq("id", userId);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: data.user.email,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
