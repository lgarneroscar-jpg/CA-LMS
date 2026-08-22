export function getModuleContentStatus(module: {
  video_url: string | null;
  stream_url?: string | null;
  workbook_content: unknown;
  exercises: unknown;
  is_live_session: boolean;
  quiz_count?: number;
}) {
  const hasWorkbook =
    !module.is_live_session &&
    module.workbook_content !== null &&
    typeof module.workbook_content === "object" &&
    Array.isArray((module.workbook_content as { blocks?: unknown }).blocks) &&
    ((module.workbook_content as { blocks: unknown[] }).blocks.length ?? 0) >
      0;

  const hasExercises =
    !module.is_live_session &&
    Array.isArray(module.exercises) &&
    module.exercises.length > 0;

  const hasVideo = module.is_live_session
    ? Boolean(module.stream_url)
    : Boolean(module.video_url);

  return {
    hasVideo,
    hasWorkbook,
    hasExercises,
    quizCount: module.quiz_count ?? 0,
  };
}
