"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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

export async function saveQuizQuestions(
  moduleId: string,
  questionsJson: string
) {
  const supabase = await requireSuperAdmin();

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

  await supabase.from("quiz_questions").delete().eq("module_id", moduleId);

  if (questions.length > 0) {
    const { error } = await supabase.from("quiz_questions").insert(
      questions.map((q, index) => ({
        module_id: moduleId,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        order_index: q.order_index ?? index + 1,
      }))
    );

    if (error) throw new Error(error.message);
  }

  revalidatePath("/superadmin/content");
  revalidatePath(`/superadmin/content/${moduleId}`);
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
