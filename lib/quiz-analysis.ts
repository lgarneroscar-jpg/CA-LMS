import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

type DbClient = SupabaseClient<Database>;

/** Answers have been recorded since this date; earlier attempts kept only a score. */
export const QUIZ_ANSWER_CAPTURE_SINCE = "2026-10-02";

/** A question needs this many students' first attempts before the report names it. */
export const MOST_MISSED_MIN_STUDENTS = 3;

const PAGE_SIZE = 1000;

export type QuizAnswerRow = {
  student_id: string;
  module_id: string;
  question_id: string;
  chosen_option: string;
  is_correct: boolean;
  attempt_at: string;
};

export type QuizQuestionRef = {
  id: string;
  module_id: string;
  question: string;
  options: Json;
  order_index: number;
};

export type QuestionAnalysis = {
  questionId: string;
  moduleId: string;
  orderIndex: number;
  question: string;
  studentsAnswered: number;
  studentsCorrect: number;
  /** 0–100, null when nobody has answered yet. */
  correctRate: number | null;
  mostChosenWrong: { optionId: string; label: string; count: number } | null;
};

export type MostMissedQuestion = {
  moduleCode: string;
  questionNumber: number;
  question: string;
  studentsAnswered: number;
  studentsCorrect: number;
  correctRate: number;
};

export function formatCaptureSince(iso: string = QUIZ_ANSWER_CAPTURE_SINCE): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function optionLabels(options: Json): Map<string, string> {
  const labels = new Map<string, string>();
  if (!Array.isArray(options)) return labels;
  options.forEach((item, i) => {
    if (typeof item === "object" && item !== null && !Array.isArray(item) && "id" in item) {
      const obj = item as { id: unknown; label?: unknown };
      labels.set(String(obj.id), String(obj.label ?? obj.id));
    } else {
      labels.set(String(i), String(item));
    }
  });
  return labels;
}

/**
 * First attempt per student per question. Students retake until they pass, so
 * later attempts mostly measure persistence; the first attempt is the signal
 * for whether a question (or the module behind it) is landing.
 */
export function firstAttempts(rows: QuizAnswerRow[]): QuizAnswerRow[] {
  const first = new Map<string, QuizAnswerRow>();
  for (const row of rows) {
    const key = `${row.student_id}:${row.question_id}`;
    const prior = first.get(key);
    if (!prior || row.attempt_at < prior.attempt_at) first.set(key, row);
  }
  return [...first.values()];
}

export function analyzeQuestions(
  questions: QuizQuestionRef[],
  rows: QuizAnswerRow[]
): QuestionAnalysis[] {
  const byQuestion = new Map<string, QuizAnswerRow[]>();
  for (const row of firstAttempts(rows)) {
    const list = byQuestion.get(row.question_id) ?? [];
    list.push(row);
    byQuestion.set(row.question_id, list);
  }

  return questions
    .map((q) => {
      const answered = byQuestion.get(q.id) ?? [];
      const correct = answered.filter((r) => r.is_correct).length;

      const wrongCounts = new Map<string, number>();
      for (const r of answered) {
        if (r.is_correct) continue;
        wrongCounts.set(r.chosen_option, (wrongCounts.get(r.chosen_option) ?? 0) + 1);
      }
      let mostChosenWrong: QuestionAnalysis["mostChosenWrong"] = null;
      const labels = optionLabels(q.options);
      for (const [optionId, count] of wrongCounts) {
        if (!mostChosenWrong || count > mostChosenWrong.count) {
          mostChosenWrong = {
            optionId,
            label: labels.get(optionId) ?? optionId,
            count,
          };
        }
      }

      return {
        questionId: q.id,
        moduleId: q.module_id,
        orderIndex: q.order_index,
        question: q.question,
        studentsAnswered: answered.length,
        studentsCorrect: correct,
        correctRate:
          answered.length > 0 ? Math.round((correct / answered.length) * 100) : null,
        mostChosenWrong,
      };
    })
    .sort(
      (a, b) =>
        a.moduleId.localeCompare(b.moduleId) || a.orderIndex - b.orderIndex
    );
}

export function pickMostMissed(
  analysis: QuestionAnalysis[],
  moduleCodeById: Map<string, string>,
  limit = 3
): MostMissedQuestion[] {
  return analysis
    .filter(
      (q) =>
        q.correctRate !== null &&
        q.correctRate < 100 &&
        q.studentsAnswered >= MOST_MISSED_MIN_STUDENTS
    )
    .sort(
      (a, b) =>
        (a.correctRate ?? 0) - (b.correctRate ?? 0) ||
        b.studentsAnswered - a.studentsAnswered
    )
    .slice(0, limit)
    .map((q) => ({
      moduleCode: moduleCodeById.get(q.moduleId) ?? "?",
      questionNumber: q.orderIndex,
      question: q.question,
      studentsAnswered: q.studentsAnswered,
      studentsCorrect: q.studentsCorrect,
      correctRate: q.correctRate ?? 0,
    }));
}

/** Paged read — quiz_answers grows past PostgREST's default row cap quickly. */
export async function fetchQuizAnswers(
  client: DbClient,
  filter: { moduleIds?: string[]; studentIds?: string[] }
): Promise<QuizAnswerRow[]> {
  if (filter.moduleIds?.length === 0 || filter.studentIds?.length === 0) {
    return [];
  }

  const rows: QuizAnswerRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = client
      .from("quiz_answers")
      .select("student_id, module_id, question_id, chosen_option, is_correct, attempt_at")
      .order("attempt_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (filter.moduleIds) query = query.in("module_id", filter.moduleIds);
    if (filter.studentIds) query = query.in("student_id", filter.studentIds);

    const { data, error } = await query;
    if (error) throw new Error(`quiz_answers: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

export async function fetchQuizQuestions(
  client: DbClient,
  moduleIds: string[]
): Promise<QuizQuestionRef[]> {
  if (moduleIds.length === 0) return [];
  const { data, error } = await client
    .from("quiz_questions")
    .select("id, module_id, question, options, order_index")
    .in("module_id", moduleIds)
    .order("order_index");
  if (error) throw new Error(`quiz_questions: ${error.message}`);
  return data ?? [];
}
