import type { Json } from "@/types/database";

export type GradableQuestion = {
  id: string;
  options: Json;
  correct_answer: string;
};

export type GradedAnswer = {
  questionId: string;
  chosenOption: string;
  isCorrect: boolean;
};

/** Option ids as stored in quiz_questions.options (objects with id, or bare labels by index). */
export function quizOptionIds(options: Json): string[] {
  if (!Array.isArray(options)) return [];
  return options.map((item, i) =>
    typeof item === "object" && item !== null && !Array.isArray(item) && "id" in item
      ? String((item as { id: unknown }).id)
      : String(i)
  );
}

/**
 * Grades a submission against the stored answer key. Rejects — never scores —
 * anything that does not match the module's questions exactly: a question from
 * another module, a missing or duplicated question, or an option the question
 * does not offer.
 */
export function gradeQuizSubmission(
  questions: GradableQuestion[],
  answers: Record<string, unknown>,
  questionIds: unknown
): GradedAnswer[] {
  if (!Array.isArray(questionIds) || questionIds.some((id) => typeof id !== "string")) {
    throw new Error("Invalid quiz submission.");
  }
  if (typeof answers !== "object" || answers === null || Array.isArray(answers)) {
    throw new Error("Invalid quiz submission.");
  }

  const byId = new Map(questions.map((q) => [q.id, q]));

  if (new Set(questionIds).size !== questionIds.length) {
    throw new Error("Invalid quiz submission: a question was submitted twice.");
  }
  for (const id of [...questionIds, ...Object.keys(answers)]) {
    if (!byId.has(id)) {
      throw new Error(
        "Invalid quiz submission: it includes a question that is not part of this module."
      );
    }
  }
  if (questionIds.length !== questions.length) {
    throw new Error(
      "This quiz has changed since the page loaded. Refresh the page and try again."
    );
  }

  const unanswered = questions.filter((q) => {
    const value = answers[q.id];
    return typeof value !== "string" || value.length === 0;
  }).length;
  if (unanswered > 0) {
    throw new Error(
      unanswered === 1
        ? "Answer every question before submitting — 1 question is still blank."
        : `Answer every question before submitting — ${unanswered} questions are still blank.`
    );
  }

  return questions.map((q) => {
    const chosen = answers[q.id] as string;
    if (!quizOptionIds(q.options).includes(chosen)) {
      throw new Error(
        "Invalid quiz submission: an answer is not one of that question's options."
      );
    }
    return {
      questionId: q.id,
      chosenOption: chosen,
      isCorrect: chosen === q.correct_answer,
    };
  });
}
