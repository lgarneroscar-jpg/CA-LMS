import { createAdminClient } from "../lib/supabase/admin";
import {
  loadWorkbookSeedFromFile,
  toDbExercises,
  toDbWorkbookContent,
} from "../lib/workbook-seed-parser";

async function main() {
  const admin = createAdminClient();
  const modules = loadWorkbookSeedFromFile();

  if (modules.length !== 14) {
    throw new Error(`Expected 14 modules, parsed ${modules.length}`);
  }

  console.log("Re-seeding workbook body content for 14 modules...\n");

  for (const module of modules) {
    const { data: existing, error: lookupError } = await admin
      .from("modules")
      .select("id, slug, module_code, title")
      .eq("module_code", module.module_code)
      .eq("is_live_session", false)
      .maybeSingle();

    if (lookupError) {
      throw new Error(`${module.module_code}: ${lookupError.message}`);
    }
    if (!existing) {
      throw new Error(`Module not found for code: ${module.module_code}`);
    }

    const workbook_content = toDbWorkbookContent(module);
    const exercises = toDbExercises(module);

    const { error: updateError } = await admin
      .from("modules")
      .update({
        workbook_content,
        exercises,
      })
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(`${module.module_code}: ${updateError.message}`);
    }

    await admin.from("quiz_questions").delete().eq("module_id", existing.id);

    const quizRows = module.quiz.map((q, index) => ({
      module_id: existing.id,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      order_index: index + 1,
    }));

    const { error: quizError } = await admin
      .from("quiz_questions")
      .insert(quizRows);

    if (quizError) {
      throw new Error(`${module.module_code} quiz: ${quizError.message}`);
    }

    const overviewFirstLine = module.overview.split(/(?<=[.!?])\s+/)[0] ?? module.overview;
    console.log(
      `${existing.slug} (${module.module_code})\n  overview: ${overviewFirstLine.slice(0, 90)}${overviewFirstLine.length > 90 ? "…" : ""}\n  frameworks: ${module.frameworks.length} | exercises: ${module.exercises.length} | quiz: ${module.quiz.length} | completion_check: ${module.completion_check.length}`
    );
  }

  console.log("\n✓ Re-seeded 14 modules (body content + exercises + quiz only).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
