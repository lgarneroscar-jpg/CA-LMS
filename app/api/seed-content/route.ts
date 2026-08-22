import { NextResponse } from "next/server";

const REFUSAL_MESSAGE =
  "This endpoint is disabled. It would overwrite real workbook content with deprecated Phase-3 approximations. Use npm run seed:workbook instead.";

export async function POST() {
  return NextResponse.json({ error: REFUSAL_MESSAGE }, { status: 410 });
}

/* Disabled — kept for reference. Previously called seedAllModuleContent(admin).
 *
 * import { createAdminClient } from "@/lib/supabase/admin";
 * import { seedAllModuleContent } from "@/lib/seed-to-db";
 *
 * function authorizeRequest(request: Request): boolean { ... }
 * ...Bearer CREATE_USER_SECRET auth, then seedAllModuleContent...
 */
