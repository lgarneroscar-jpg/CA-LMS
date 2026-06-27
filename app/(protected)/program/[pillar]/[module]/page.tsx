import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getPillarFromSlug,
  getPillarSlug,
  parseWorkbookContent,
} from "@/lib/program";
import { getOrCreateProgress, toProgressState } from "@/lib/progress";
import {
  getContentModuleCatalog,
  getStudentProgressMap,
  findNextModuleHref,
} from "@/lib/modules-queries";
import { ModuleExperience } from "@/components/modules/module-experience";
import type { ExerciseField } from "@/types/modules";
import type { QuizQuestionView } from "@/components/modules/quiz-section";
import type { Json } from "@/types/database";
import { normalizeExerciseField } from "@/lib/content-normalize";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

type PageProps = {
  params: Promise<{ pillar: string; module: string }>;
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

function parseQuizOptions(raw: Json): { id: string; label: string }[] {
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

export default async function ModulePage({ params }: PageProps) {
  const { pillar: pillarSlug, module: moduleSlug } = await params;
  const profile = await requireRole(["student"]);

  const pillar = getPillarFromSlug(pillarSlug);
  if (!pillar) notFound();

  const diagnosticComplete = profile.diagnostic_complete || profile.is_demo;

  if (!diagnosticComplete) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6 text-sm">
            Complete the entry diagnostic before accessing modules.{" "}
            <Link href="/diagnostic" className="font-medium underline">
              Go to diagnostic
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: module, error } = await supabase
    .from("modules")
    .select(
      "id, module_code, title, slug, pillar, video_url, workbook_content, exercises, unlock_week, order_index"
    )
    .eq("slug", moduleSlug)
    .eq("pillar", pillar)
    .eq("is_live_session", false)
    .single();

  if (error || !module) notFound();

  const [progressRow, savedResult, quizResult, catalog, progressMap] =
    await Promise.all([
      getOrCreateProgress(profile.id, module.id),
      supabase
        .from("exercise_responses")
        .select("exercise_key, response")
        .eq("student_id", profile.id)
        .eq("module_id", module.id),
      supabase
        .from("quiz_questions")
        .select("id, question, options, correct_answer, order_index")
        .eq("module_id", module.id)
        .order("order_index"),
      getContentModuleCatalog(),
      getStudentProgressMap(profile.id),
    ]);

  const progress = toProgressState(progressRow);
  const workbook = parseWorkbookContent(module.workbook_content);
  const exercises = parseExercises(module.exercises);

  const savedResponses: Record<string, string> = {};
  savedResult.data?.forEach((r) => {
    if (r.response) savedResponses[r.exercise_key] = r.response;
  });

  const quizRows = quizResult.data ?? [];
  const questions: QuizQuestionView[] = quizRows.map((q) => ({
    id: q.id,
    question: q.question,
    options: parseQuizOptions(q.options),
  }));

  const correctAnswers: Record<string, string> = {};
  quizRows.forEach((q) => {
    correctAnswers[q.id] = q.correct_answer;
  });

  const nextModuleHref = findNextModuleHref(
    catalog,
    progressMap,
    module.id
  );

  const modulePillarSlug = getPillarSlug(module.pillar) ?? pillarSlug;

  return (
    <ModuleExperience
      moduleId={module.id}
      pillarSlug={modulePillarSlug}
      moduleSlug={module.slug}
      title={module.title}
      moduleCode={module.module_code}
      pillar={module.pillar}
      estimatedMinutes={workbook.estimated_minutes}
      videoUrl={module.video_url ?? "https://www.youtube.com/watch?v=LXb3EKWsInQ"}
      workbookBlocks={workbook.blocks}
      exercises={exercises}
      questions={questions}
      correctAnswers={correctAnswers}
      progress={progress}
      savedResponses={savedResponses}
      nextModuleHref={nextModuleHref}
      studentName={profile.full_name?.split(" ")[0] ?? "Student"}
    />
  );
}
