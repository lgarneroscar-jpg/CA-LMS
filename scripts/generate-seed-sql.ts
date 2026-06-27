import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ALL_MODULES,
  LIVE_SESSIONS,
  toDbExercises,
  toDbWorkbookContent,
} from "../content";

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlJson(value: unknown) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

const statements: string[] = [
  "-- Phase 3 full curriculum seed (14 modules + 4 live sessions)",
];

for (const module of ALL_MODULES) {
  statements.push(`
INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, video_url, workbook_content, exercises, is_live_session
) VALUES (
  ${sqlString(module.module_code)},
  ${sqlString(module.title)},
  ${sqlString(module.slug)},
  ${module.pillar},
  ${module.unlock_week},
  ${module.order_index},
  ${sqlString(module.description)},
  ${sqlString(module.video_url)},
  ${sqlJson(toDbWorkbookContent(module))},
  ${sqlJson(toDbExercises(module))},
  false
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  workbook_content = EXCLUDED.workbook_content,
  exercises = EXCLUDED.exercises,
  is_live_session = EXCLUDED.is_live_session;
`);

  statements.push(`
DELETE FROM public.quiz_questions
WHERE module_id = (SELECT id FROM public.modules WHERE module_code = ${sqlString(module.module_code)});
`);

  module.quiz.forEach((q, index) => {
    statements.push(`
INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = ${sqlString(module.module_code)}),
  ${sqlString(q.question)},
  ${sqlJson(q.options)},
  ${sqlString(q.correct_answer)},
  ${index + 1}
);`);
  });
}

for (const session of LIVE_SESSIONS) {
  statements.push(`
INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, stream_url, video_url, workbook_content, exercises, is_live_session
) VALUES (
  ${sqlString(session.module_code)},
  ${sqlString(session.title)},
  ${sqlString(session.slug)},
  ${session.pillar},
  ${session.unlock_week},
  ${session.order_index},
  ${sqlString(session.description)},
  ${sqlString(session.stream_url)},
  NULL,
  NULL,
  NULL,
  true
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  stream_url = EXCLUDED.stream_url,
  is_live_session = EXCLUDED.is_live_session;
`);
}

const sql = statements.join("\n");
const outPath = join(process.cwd(), "supabase", "migrations", "20240526200000_seed_phase3_all_modules.sql");
writeFileSync(outPath, sql, "utf8");
console.log(`Wrote ${outPath} (${sql.length} bytes)`);
