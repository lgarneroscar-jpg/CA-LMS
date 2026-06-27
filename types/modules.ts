export type WorkbookBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "callout"; title: string; body: string }
  | { type: "framework_callout"; title: string; body: string }
  | { type: "concept_block"; title: string; body: string };

export type WorkbookContent = {
  estimated_minutes: number;
  blocks: WorkbookBlock[];
};

export type ExerciseField =
  | {
      key: string;
      type: "text";
      label: string;
      instructions?: string;
      placeholder?: string;
      multiline?: boolean;
    }
  | {
      key: string;
      type: "choice";
      label: string;
      instructions?: string;
      options: string[];
    }
  | {
      key: string;
      type: "checkbox";
      label: string;
      instructions?: string;
    };

export type QuizOption = {
  id: string;
  label: string;
};

export type ModuleProgressState = {
  video_watched: boolean;
  exercises_submitted: boolean;
  quiz_completed: boolean;
  quiz_score: number | null;
  is_complete: boolean;
  xp_earned: number;
};

export const PILLARS = {
  1: {
    slug: "identity-brand-building",
    label: "Identity & Brand Building",
    weeks: "Weeks 1–4",
  },
  2: {
    slug: "executive-communication",
    label: "Executive Communication & Social Capital",
    weeks: "Weeks 5–8",
  },
  3: {
    slug: "career-navigation",
    label: "Career Navigation Strategy & Execution",
    weeks: "Weeks 9–12",
  },
} as const;

export type PillarNumber = keyof typeof PILLARS;

export type ContentModuleStatus = {
  hasVideo: boolean;
  hasWorkbook: boolean;
  hasExercises: boolean;
  quizCount: number;
};
