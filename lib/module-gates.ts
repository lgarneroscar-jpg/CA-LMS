/**
 * Module unlock gates — flip these when real videos and exercise flow are live.
 *
 * VIDEO_GATE_ENABLED: exercises stay locked until 90% of the video is watched.
 * EXERCISE_SUBMIT_GATE_ENABLED: quiz stays locked until workbook exercises are answered.
 */

/** Set to true when module videos are real and 90% watch should unlock exercises. */
export const VIDEO_GATE_ENABLED = false;

/** Quiz stays locked until every workbook exercise has a non-empty answer. */
export const EXERCISE_SUBMIT_GATE_ENABLED = true;

/**
 * Minimum fraction of correct answers to pass a quiz.
 * On the current 4-question quizzes this is 3 of 4. Always divide by the
 * module's actual question count — never hardcode 4.
 */
export const QUIZ_PASS_THRESHOLD = 0.75;

/**
 * Completion definition versions (Stage 2 stamps this into every snapshot):
 *   "quiz-only"        — quiz submitted (any score); workbook not required
 *   "workbook+quiz75"  — all exercises answered + quiz ≥ 75% (current)
 *   (later)            — will add video when VIDEO_GATE_ENABLED flips on
 *
 * Do not remove or rename this export. Existing is_complete rows are never
 * revoked when the version changes — the stamp explains the discontinuity.
 */
export const COMPLETION_DEFINITION_VERSION = "workbook+quiz75";

export function isExercisesLocked(videoWatched: boolean): boolean {
  return VIDEO_GATE_ENABLED && !videoWatched;
}

export function isQuizLocked(exercisesSubmitted: boolean): boolean {
  return EXERCISE_SUBMIT_GATE_ENABLED && !exercisesSubmitted;
}

export function assertVideoWatched(videoWatched: boolean, message: string): void {
  if (VIDEO_GATE_ENABLED && !videoWatched) {
    throw new Error(message);
  }
}

export function assertExercisesSubmitted(
  exercisesSubmitted: boolean,
  message: string
): void {
  if (EXERCISE_SUBMIT_GATE_ENABLED && !exercisesSubmitted) {
    throw new Error(message);
  }
}

/** Pass when score / questionCount >= QUIZ_PASS_THRESHOLD. */
export function isQuizPassingScore(
  score: number,
  questionCount: number
): boolean {
  if (questionCount <= 0) return false;
  return score / questionCount >= QUIZ_PASS_THRESHOLD;
}

/** Whole correct answers needed to pass (e.g. 3 of 4). */
export function quizPassCorrectCount(questionCount: number): number {
  if (questionCount <= 0) return 0;
  return Math.ceil(QUIZ_PASS_THRESHOLD * questionCount);
}

export function moduleCompletionPrerequisitesMet(progress: {
  video_watched: boolean;
  exercises_submitted: boolean;
  quiz_completed: boolean;
}): boolean {
  const videoOk = !VIDEO_GATE_ENABLED || progress.video_watched;
  const exercisesOk =
    !EXERCISE_SUBMIT_GATE_ENABLED || progress.exercises_submitted;
  return videoOk && exercisesOk && progress.quiz_completed;
}

/** Short label for admin UI explaining what "modules passed" means today. */
export function moduleCompletionExplainer(): string {
  return "A module counts as complete when every workbook exercise is answered and the quiz is scored at or above 75%.";
}
