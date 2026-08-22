import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ALL_MODULES,
  LIVE_SESSIONS,
  toDbExercises,
  toDbWorkbookContent,
} from "@/content";
import type { Database } from "@/types/database";

type AdminClient = SupabaseClient<Database>;

export async function seedAllModuleContent(admin: AdminClient) {
  const results: { module_code: string; id: string }[] = [];

  for (const module of ALL_MODULES) {
    const { data, error } = await admin
      .from("modules")
      .upsert(
        {
          module_code: module.module_code,
          title: module.title,
          slug: module.slug,
          pillar: module.pillar,
          unlock_week: module.unlock_week,
          order_index: module.order_index,
          description: module.description,
          video_url: module.video_url,
          workbook_content: toDbWorkbookContent(module),
          exercises: toDbExercises(module),
          is_live_session: false,
        },
        { onConflict: "module_code" }
      )
      .select("id, module_code")
      .single();

    if (error) throw new Error(`${module.module_code}: ${error.message}`);
    if (!data) throw new Error(`${module.module_code}: no row returned`);

    await admin
      .from("quiz_questions")
      .delete()
      .eq("module_id", data.id);

    const quizRows = module.quiz.map((q, index) => ({
      module_id: data.id,
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

    results.push({ module_code: data.module_code, id: data.id });
  }

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
      .select("id, module_code")
      .single();

    if (error) throw new Error(`${session.module_code}: ${error.message}`);
    if (!data) throw new Error(`${session.module_code}: no row returned`);
    results.push({ module_code: data.module_code, id: data.id });
  }

  return results;
}
