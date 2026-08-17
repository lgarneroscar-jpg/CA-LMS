import { createAdminClient } from "../lib/supabase/admin";
import { LIVE_SESSIONS } from "../content";

/**
 * Upserts live sessions from content/live-sessions.ts by module_code.
 * Does NOT touch the 14 workbook modules — use seed:workbook for those.
 */
async function main() {
  const admin = createAdminClient();
  console.log(`Seeding ${LIVE_SESSIONS.length} live sessions from content/live-sessions.ts…\n`);

  for (const session of LIVE_SESSIONS) {
    const { data, error } = await admin
      .from("modules")
      .upsert(
        {
          module_code: session.module_code,
          title: session.title,
          slug: session.slug,
          pillar: session.pillar,
          unlock_week: session.unlock_week,
          order_index: session.order_index,
          description: session.description,
          video_url: null,
          stream_url: session.stream_url,
          workbook_content: null,
          exercises: null,
          is_live_session: true,
        },
        { onConflict: "module_code" }
      )
      .select("id, module_code, title, unlock_week")
      .single();

    if (error) throw new Error(`${session.module_code}: ${error.message}`);
    if (!data) throw new Error(`${session.module_code}: no row returned`);

    console.log(
      `  ${data.module_code} week ${data.unlock_week} — ${data.title} (${data.id})`
    );
  }

  console.log("\n✓ Live sessions upserted (LS1–LS5 by module_code).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
