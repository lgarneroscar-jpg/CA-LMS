/**
 * Attempts outcome writes as a real student through the public REST API.
 *
 *   npm run probe:student-writes -- student@example.com
 *
 * Signs in as the given student via a service-role magic link (no email is
 * sent, no password is used). Every probe targets a row that cannot exist (nil
 * uuid filters, invalid foreign keys), so no data changes even if a write is
 * permitted -- a permitted write shows as "NOT BLOCKED", a revoked privilege as
 * "BLOCKED".
 */
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "../lib/supabase/admin";
import type { Database } from "../types/database";

const NIL = "00000000-0000-0000-0000-000000000000";

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error("Usage: npm run probe:student-writes -- <student email>");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const admin = createAdminClient();

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError || !link.properties?.hashed_token) {
    throw new Error(`Could not issue a sign-in link: ${linkError?.message}`);
  }

  const student = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: session, error: otpError } = await student.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (otpError || !session.user) throw new Error(`Sign-in failed: ${otpError?.message}`);
  const me = session.user.id;

  const { data: profile } = await student.from("profiles").select("role").eq("id", me).single();
  if (profile?.role !== "student") {
    throw new Error(`${email} is not a student (role: ${profile?.role ?? "unknown"})`);
  }

  type Probe = [string, PromiseLike<{ error: { code?: string; message: string } | null }>];
  const mustBlock: Probe[] = [
    ["update student_progress set is_complete = true",
      student.from("student_progress").update({ is_complete: true, quiz_completed: true }).eq("id", NIL)],
    ["insert student_progress",
      student.from("student_progress").insert({ student_id: me, module_id: NIL, is_complete: true })],
    ["delete student_progress",
      student.from("student_progress").delete().eq("id", NIL)],
    ["update profiles set xp = 9999",
      student.from("profiles").update({ xp: 9999 }).eq("id", NIL)],
    ["update profiles set role = 'super_admin'",
      student.from("profiles").update({ role: "super_admin" }).eq("id", NIL)],
    ["update profiles set institution_id",
      student.from("profiles").update({ institution_id: NIL }).eq("id", NIL)],
    ["update profiles set rank = 1",
      student.from("profiles").update({ rank: 1 }).eq("id", NIL)],
    ["update profiles set program_completed_at",
      student.from("profiles").update({ program_completed_at: new Date().toISOString() }).eq("id", NIL)],
    ["insert into quiz_answers",
      student.from("quiz_answers").insert({
        student_id: me, module_id: NIL, question_id: NIL, chosen_option: "a", is_correct: true,
      })],
    ["update capri_scores set value = 100",
      student.from("capri_scores").update({ value: 100 }).eq("id", NIL)],
  ];
  const mustAllow: Probe[] = [
    ["update profiles set bio (own editable column)",
      student.from("profiles").update({ bio: "probe" }).eq("id", NIL)],
  ];

  // "No error" means the privilege exists; RLS may still hide every row, so it
  // is not proof a real write would land -- but it is not a permission error.
  const describe = (error: { code?: string; message: string } | null) =>
    !error
      ? "NOT REVOKED (no error; matched 0 rows, nothing changed)"
      : error.code === "42501"
        ? `BLOCKED (${error.message})`
        : error.code === "23503"
          ? "NOT BLOCKED (reached the foreign-key check; a real id would be written)"
          : `other error [${error.code}]: ${error.message}`;

  console.log(`Probing as ${email} (${me})\n`);
  for (const [name, request] of mustBlock) {
    console.log(`${name.padEnd(48)} ${describe((await request).error)}`);
  }
  console.log("");
  for (const [name, request] of mustAllow) {
    const { error } = await request;
    console.log(`${name.padEnd(48)} ${error ? `UNEXPECTED ERROR: ${error.message}` : "allowed"}`);
  }

  await student.auth.signOut({ scope: "local" });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
