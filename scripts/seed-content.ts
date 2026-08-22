/**
 * ⚠️ DISABLED — This script seeded from deprecated Phase-3 content approximations
 * and overwrote real workbook bodies. Use `npm run seed:workbook` instead.
 */
import { createAdminClient } from "../lib/supabase/admin";
import { seedAllModuleContent } from "../lib/seed-to-db";

const REFUSAL_MESSAGE = `
REFUSED: scripts/seed-content.ts is disabled.

This script would overwrite all 14 module bodies in Supabase with deprecated
Phase-3 AI-generated approximations from content/DEPRECATED-DO-NOT-USE-pillar-*.ts.

Real curriculum source of truth: workbook-content-seed.md
Correct seed command: npm run seed:workbook

Live sessions only: npm run seed:live
`.trim();

console.error(REFUSAL_MESSAGE);
process.exit(1);

async function main() {
  const admin = createAdminClient();
  const results = await seedAllModuleContent(admin);
  console.log(`Seeded ${results.length} modules/sessions:`);
  for (const row of results) {
    console.log(`  ${row.module_code} (${row.id})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
