/** Canonized in the Q1 quiz pass: 56 questions ÷ 14 modules. */
export const QUIZ_QUESTIONS_PER_MODULE = 4;

const PLACEHOLDER_URL_PATTERN = /placeholder/i;

export function isPlaceholderMediaUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  return PLACEHOLDER_URL_PATTERN.test(url);
}

/** When every module shares one URL it is almost certainly a seed placeholder. */
export function getSharedVideoUrl(
  videoUrls: (string | null | undefined)[]
): string | null {
  const nonNull = videoUrls.filter((url): url is string => Boolean(url));
  if (nonNull.length === 0) return null;
  const first = nonNull[0];
  return nonNull.every((url) => url === first) ? first : null;
}

export function videoContentIsPlaceholder(
  videoUrl: string | null | undefined,
  allModuleVideoUrls: (string | null | undefined)[]
): boolean {
  if (!videoUrl) return true;
  if (isPlaceholderMediaUrl(videoUrl)) return true;
  const shared = getSharedVideoUrl(allModuleVideoUrls);
  if (shared && videoUrl === shared) return true;
  return false;
}

export function countPlaceholderVideos(
  modules: { video_url: string | null; is_live_session: boolean }[]
): { placeholderCount: number; totalContentModules: number } {
  const contentModules = modules.filter((m) => !m.is_live_session);
  const allUrls = contentModules.map((m) => m.video_url);
  const placeholderCount = contentModules.filter((m) =>
    videoContentIsPlaceholder(m.video_url, allUrls)
  ).length;

  return {
    placeholderCount,
    totalContentModules: contentModules.length,
  };
}

export function videosTrackedInReporting(
  modules: { video_url: string | null; is_live_session: boolean }[]
): boolean {
  const { placeholderCount, totalContentModules } = countPlaceholderVideos(modules);
  if (totalContentModules === 0) return false;
  return placeholderCount < totalContentModules;
}

export function getModuleContentStatus(module: {
  video_url: string | null;
  stream_url?: string | null;
  workbook_content: unknown;
  exercises: unknown;
  is_live_session: boolean;
  quiz_count?: number;
  all_module_video_urls?: (string | null)[];
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

  const allVideoUrls = module.all_module_video_urls ?? [module.video_url];

  const hasRealVideo = module.is_live_session
    ? Boolean(module.stream_url) && !isPlaceholderMediaUrl(module.stream_url)
    : Boolean(module.video_url) &&
      !videoContentIsPlaceholder(module.video_url, allVideoUrls);

  const videoIsPlaceholder = module.is_live_session
    ? isPlaceholderMediaUrl(module.stream_url)
    : videoContentIsPlaceholder(module.video_url, allVideoUrls);

  return {
    hasVideo: hasRealVideo,
    videoIsPlaceholder,
    hasWorkbook,
    hasExercises,
    quizCount: module.quiz_count ?? 0,
  };
}
