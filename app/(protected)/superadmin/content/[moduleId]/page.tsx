import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseWorkbookContent } from "@/lib/program";
import { normalizeExerciseField } from "@/lib/content-normalize";
import { ModuleContentEditor } from "@/components/superadmin/module-content-editor";
import type { ExerciseField } from "@/types/modules";

type PageProps = {
  params: Promise<{ moduleId: string }>;
};

function parseExercises(raw: unknown): ExerciseField[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) =>
      item && typeof item === "object"
        ? normalizeExerciseField(item as Record<string, unknown>)
        : null
    )
    .filter((item): item is ExerciseField => item !== null);
}

function parseQuizOptions(raw: unknown): { id: string; label: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    if (typeof item === "object" && item !== null && "id" in item && "label" in item) {
      return {
        id: String((item as { id: string }).id),
        label: String((item as { label: string }).label),
      };
    }
    return { id: String(i), label: String(item) };
  });
}

export default async function ModuleContentEditPage({ params }: PageProps) {
  const { moduleId } = await params;
  await requireRole(["super_admin"]);
  const supabase = await createClient();

  const { data: module } = await supabase
    .from("modules")
    .select("*")
    .eq("id", moduleId)
    .eq("is_live_session", false)
    .single();

  if (!module) notFound();

  const { data: quizRows } = await supabase
    .from("quiz_questions")
    .select("id, question, options, correct_answer, order_index")
    .eq("module_id", moduleId)
    .order("order_index");

  const workbook = parseWorkbookContent(module.workbook_content);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link
        href="/superadmin/content"
        className="inline-flex h-7 items-center rounded-lg bg-secondary px-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
      >
        ← Back to content list
      </Link>
      <ModuleContentEditor
        moduleId={module.id}
        moduleCode={module.module_code}
        title={module.title}
        initialVideoUrl={module.video_url ?? ""}
        initialDescription={module.description ?? ""}
        initialWorkbook={workbook}
        initialExercises={parseExercises(module.exercises)}
        initialQuiz={(quizRows ?? []).map((q) => ({
          id: q.id,
          question: q.question,
          options: parseQuizOptions(q.options),
          correct_answer: q.correct_answer,
          order_index: q.order_index,
        }))}
      />
    </div>
  );
}
