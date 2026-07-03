/**
 * Module unlock gates — flip these when real videos and exercise flow are live.
 *
 * VIDEO_GATE_ENABLED: exercises stay locked until 90% of the video is watched.
 * EXERCISE_SUBMIT_GATE_ENABLED: quiz stays locked until exercises are submitted.
 */

/** Set to true when module videos are real and 90% watch should unlock exercises. */
export const VIDEO_GATE_ENABLED = false;

/** Set to true when the quiz should require exercises to be submitted first. */
export const EXERCISE_SUBMIT_GATE_ENABLED = false;

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
