import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { seedAllModuleContent } from "@/lib/seed-to-db";

function authorizeRequest(request: Request): boolean {
  const secret = process.env.CREATE_USER_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  return authHeader.slice("Bearer ".length) === secret;
}

export async function POST(request: Request) {
  if (!authorizeRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const results = await seedAllModuleContent(admin);
    return NextResponse.json({
      success: true,
      seeded: results.length,
      modules: results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
