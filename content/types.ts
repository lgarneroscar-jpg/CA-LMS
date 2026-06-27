export type WorkbookBlockSeed =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "framework_callout"; title: string; body: string }
  | { type: "concept_block"; title: string; body: string };

export type ExerciseSeed = {
  key: string;
  label: string;
  instructions: string;
  input_type: "text" | "radio" | "checklist";
  placeholder?: string;
  multiline?: boolean;
  options?: string[];
};

export type QuizSeed = {
  question: string;
  options: { id: string; label: string }[];
  correct_answer: string;
};

export type ModuleSeed = {
  module_code: string;
  title: string;
  slug: string;
  pillar: number;
  unlock_week: number;
  order_index: number;
  description: string;
  estimated_minutes: number;
  video_url: string;
  workbook: WorkbookBlockSeed[];
  exercises: ExerciseSeed[];
  quiz: QuizSeed[];
};

export type LiveSessionSeed = {
  module_code: string;
  title: string;
  slug: string;
  pillar: number;
  unlock_week: number;
  order_index: number;
  description: string;
  stream_url: string;
  is_live_session: true;
};
