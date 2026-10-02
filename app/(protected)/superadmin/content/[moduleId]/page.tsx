import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseWorkbookContent } from "@/lib/program";
import { normalizeExerciseField } from "@/lib/content-normalize";
import { ModuleContentEditor } from "@/components/superadmin/module-content-editor";
import { QuestionAnalysisTable } from "@/components/superadmin/question-analysis-table";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeQuestions, fetchQuizAnswers } from "@/lib/quiz-analysis";
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

  // The answer key column is not readable by client roles.
  const admin = createAdminClient();
  const [{ data: quizRows }, answerRows] = await Promise.all([
    admin
      .from("quiz_questions")
      .select("id, module_id, question, options, correct_answer, order_index")
      .eq("module_id", moduleId)
      .order("order_index"),
    fetchQuizAnswers(admin, { moduleIds: [moduleId] }),
  ]);

  const answeringStudentIds = [...new Set(answerRows.map((r) => r.student_id))];
  const { data: demoRows } = answeringStudentIds.length
    ? await admin
        .from("profiles")
        .select("id")
        .in("id", answeringStudentIds)
        .eq("is_demo", true)
    : { data: [] };
  const demoIds = new Set((demoRows ?? []).map((r) => r.id));

  const analysis = analyzeQuestions(
    quizRows ?? [],
    answerRows.filter((r) => !demoIds.has(r.student_id))
  );
  const correctLabels = new Map(
    (quizRows ?? []).map((q) => [
      q.id,
      parseQuizOptions(q.options).find((o) => o.id === q.correct_answer)?.label ??
        q.correct_answer,
    ])
  );

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
      <QuestionAnalysisTable analysis={analysis} correctLabels={correctLabels} />
    </div>
  );
}
