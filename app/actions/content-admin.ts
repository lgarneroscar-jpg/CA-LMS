"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ExerciseField, WorkbookBlock } from "@/types/modules";
import type { Json } from "@/types/database";

async function requireSuperAdmin() {
  await requireRole(["super_admin"]);
  return createClient();
}

export async function updateModuleContent(formData: FormData) {
  const supabase = await requireSuperAdmin();

  const moduleId = String(formData.get("moduleId") ?? "");
  const videoUrl = String(formData.get("videoUrl") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const workbookJson = String(formData.get("workbookJson") ?? "");
  const exercisesJson = String(formData.get("exercisesJson") ?? "");

  if (!moduleId) throw new Error("Missing module id");

  let workbook_content: Json;
  let exercises: Json;

  try {
    workbook_content = JSON.parse(workbookJson) as Json;
    exercises = JSON.parse(exercisesJson) as Json;
  } catch {
    throw new Error("Invalid JSON in workbook or exercises");
  }

  const { error } = await supabase
    .from("modules")
    .update({
      video_url: videoUrl,
      description,
      workbook_content,
      exercises,
    })
    .eq("id", moduleId);

  if (error) throw new Error(error.message);

  revalidatePath("/superadmin/content");
  revalidatePath(`/superadmin/content/${moduleId}`);
  revalidatePath("/program");
  revalidatePath("/dashboard");
}

export type SavedQuizQuestion = {
  id: string;
  question: string;
  options: { id: string; label: string }[];
  correct_answer: string;
  order_index: number;
};

/**
 * Questions are updated in place by id rather than deleted and re-inserted:
 * quiz_answers cascades on question delete, so a full replace would erase the
 * module's answer history on every save. Only questions removed in the editor
 * are deleted.
 */
export async function saveQuizQuestions(
  moduleId: string,
  questionsJson: string
): Promise<SavedQuizQuestion[]> {
  await requireRole(["super_admin"]);
  // The answer key column is not readable by client roles.
  const admin = createAdminClient();

  let questions: {
    id?: string;
    question: string;
    options: { id: string; label: string }[];
    correct_answer: string;
    order_index: number;
  }[];

  try {
    questions = JSON.parse(questionsJson);
  } catch {
    throw new Error("Invalid quiz JSON");
  }

  const { data: existing, error: existingError } = await admin
    .from("quiz_questions")
    .select("id")
    .eq("module_id", moduleId);
  if (existingError) throw new Error(existingError.message);

  const existingIds = new Set((existing ?? []).map((row) => row.id));
  const keptIds = new Set(
    questions.map((q) => q.id).filter((id): id is string => !!id && existingIds.has(id))
  );
  const removedIds = [...existingIds].filter((id) => !keptIds.has(id));

  if (removedIds.length > 0) {
    const { error } = await admin
      .from("quiz_questions")
      .delete()
      .in("id", removedIds);
    if (error) throw new Error(error.message);
  }

  for (const [index, q] of questions.entries()) {
    const row = {
      module_id: moduleId,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      order_index: q.order_index ?? index + 1,
    };
    const { error } =
      q.id && keptIds.has(q.id)
        ? await admin.from("quiz_questions").update(row).eq("id", q.id)
        : await admin.from("quiz_questions").insert(row);
    if (error) throw new Error(error.message);
  }

  const { data: saved, error: savedError } = await admin
    .from("quiz_questions")
    .select("id, question, options, correct_answer, order_index")
    .eq("module_id", moduleId)
    .order("order_index");
  if (savedError) throw new Error(savedError.message);

  revalidatePath("/superadmin/content");
  revalidatePath(`/superadmin/content/${moduleId}`);

  return (saved ?? []).map((row) => ({
    id: row.id,
    question: row.question,
    options: Array.isArray(row.options)
      ? (row.options as { id: string; label: string }[])
      : [],
    correct_answer: row.correct_answer,
    order_index: row.order_index,
  }));
}

export async function updateLiveSession(formData: FormData) {
  const supabase = await requireSuperAdmin();

  const moduleId = String(formData.get("moduleId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const streamUrl = String(formData.get("streamUrl") ?? "").trim() || null;
  const recordingUrl =
    String(formData.get("recordingUrl") ?? "").trim() || null;

  if (!moduleId || !title) throw new Error("Missing required fields");

  const { error } = await supabase
    .from("modules")
    .update({
      title,
      description,
      stream_url: streamUrl,
      recording_url: recordingUrl,
    })
    .eq("id", moduleId);

  if (error) throw new Error(error.message);

  revalidatePath("/superadmin/content/live-sessions");
  revalidatePath("/superadmin/content");
}

export type AdminModuleEditorData = {
  id: string;
  module_code: string;
  title: string;
  slug: string;
  pillar: number;
  unlock_week: number;
  order_index: number;
  description: string | null;
  video_url: string | null;
  workbook_content: { estimated_minutes: number; blocks: WorkbookBlock[] };
  exercises: ExerciseField[];
  quiz_questions: {
    id: string;
    question: string;
    options: { id: string; label: string }[];
    correct_answer: string;
    order_index: number;
  }[];
};
