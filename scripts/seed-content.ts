import { createAdminClient } from "../lib/supabase/admin";
import { seedAllModuleContent } from "../lib/seed-to-db";

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
