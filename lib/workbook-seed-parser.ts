import { readFileSync } from "fs";
import { join } from "path";
import type { WorkbookBlock } from "@/types/modules";

export type ExerciseInputType =
  | "anchor_select"
  | "rewrite_pairs"
  | "fill_blank"
  | "reflection"
  | "checklist"
  | "star"
  | "tier_map"
  | "scorecard";

export type ParsedExerciseField = {
  key: string;
  label: string;
};

export type ParsedExercise = {
  key: string;
  title: string;
  label: string;
  instructions: string;
  input_type: ExerciseInputType;
  fields: ParsedExerciseField[];
  options?: string[];
};

export type ParsedQuiz = {
  question: string;
  options: { id: string; label: string }[];
  correct_answer: string;
};

export type ParsedWorkbookModule = {
  module_code: string;
  slug: string;
  unlock_week: number;
  overview: string;
  concepts: { heading: string; body: string }[];
  frameworks: { name: string; body: string }[];
  exercises: ParsedExercise[];
  application: string[];
  completion_check: string[];
  quiz: ParsedQuiz[];
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

function parseNumberedConcept(line: string): { heading: string; body: string } | null {
  const match = line.match(/^\d+\.\s+\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
  if (!match) return null;
  return { heading: match[1].trim(), body: match[2].trim() };
}

const SCORECARD_DESCRIPTOR = /^(.+?)\s*\(\s*score\s*\+\s*notes\s*\)\s*$/i;
const SCORECARD_TOTAL = /^total\s*\/?\s*\d+$/i;

function parseOptionsSegment(raw: string): string[] {
  return raw
    .split(/,\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseFields(
  raw: string,
  inputType?: ExerciseInputType
): ParsedExerciseField[] {
  const cleaned = raw.replace(/\s*—\s*seed prompts:.*$/i, "").trim();

  const pairsMatch = cleaned.match(/(\d+)\s+pairs?\s+of\s+\{([^}]+)\}/i);
  if (pairsMatch) {
    const count = Number(pairsMatch[1]);
    const pairKeys = pairsMatch[2].split(",").map((s) => s.trim());
    const fields: ParsedExerciseField[] = [];
    for (let i = 1; i <= count; i++) {
      for (const key of pairKeys) {
        fields.push({
          key: `${key}_${i}`,
          label: `${key.replace(/_/g, " ")} ${i}`,
        });
      }
    }
    return fields;
  }

  const fields: ParsedExerciseField[] = [];

  for (const part of cleaned.split(/,\s*/)) {
    const label = part.trim().replace(/^"|"$/g, "");
    if (!label) continue;

    if (inputType === "scorecard" && SCORECARD_TOTAL.test(label)) {
      continue;
    }

    const scorecardMatch = label.match(SCORECARD_DESCRIPTOR);
    if (scorecardMatch) {
      const rowLabel = scorecardMatch[1].trim();
      fields.push({
        key: slugify(rowLabel) || `field_${fields.length + 1}`,
        label: rowLabel,
      });
      continue;
    }

    if (label.includes(" + ")) {
      for (const subpart of label.split(/\s*\+\s*/)) {
        const subLabel = subpart.trim();
        if (!subLabel) continue;
        fields.push({
          key: slugify(subLabel) || `field_${fields.length + 1}`,
          label: subLabel,
        });
      }
      continue;
    }

    fields.push({
      key: slugify(label) || `field_${fields.length + 1}`,
      label,
    });
  }

  return fields;
}

function parseExerciseLine(line: string): ParsedExercise | null {
  const titleMatch = line.match(/^\d+\.\s+\*\*(.+?)\*\*/);
  if (!titleMatch) return null;

  const inputTypeMatch = line.match(/input_type:\s*`([^`]+)`/i);
  if (!inputTypeMatch) return null;

  const fieldsMatch = line.match(
    /fields:\s*(.+?)(?:\s*\|\s*options:\s*(.+))?$/i
  );
  if (!fieldsMatch) return null;

  const afterInputType = line.split(/input_type:\s*`[^`]+`\s*\|\s*/i)[1];
  const instructions =
    afterInputType?.split(/\s*\|\s*fields:/i)[0]?.trim() ?? "";

  const title = titleMatch[1].trim();
  const input_type = inputTypeMatch[1].trim() as ExerciseInputType;
  const fields = parseFields(fieldsMatch[1].trim(), input_type);
  const optionsRaw = fieldsMatch[2]?.trim();
  const options = optionsRaw ? parseOptionsSegment(optionsRaw) : undefined;

  const key = slugify(title);

  return {
    key,
    title,
    label: title,
    instructions,
    input_type,
    fields,
    ...(options?.length ? { options } : {}),
  };
}

function normalizeQuizLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function resolveCorrectOption(
  options: { id: string; label: string }[],
  correctLabel: string,
  context: { moduleCode: string; questionNumber: number }
): { id: string; label: string } {
  const exact = options.find((o) => o.label === correctLabel);
  if (exact) return exact;

  const normalizedKey = normalizeQuizLabel(correctLabel).toLowerCase();
  const normalized = options.find(
    (o) => normalizeQuizLabel(o.label).toLowerCase() === normalizedKey
  );
  if (normalized) return normalized;

  throw new Error(
    `${context.moduleCode} Q${context.questionNumber}: correct answer "${correctLabel}" does not match any option (${options.map((o) => `"${o.label}"`).join(", ")})`
  );
}

function parseQuizLine(
  line: string,
  context: { moduleCode: string; questionNumber: number }
): ParsedQuiz {
  const questionNumberMatch = line.match(/^(\d+)\.\s*(.+)$/);
  if (!questionNumberMatch) {
    throw new Error(
      `${context.moduleCode} Q${context.questionNumber}: quiz line must start with a number`
    );
  }

  const rest = questionNumberMatch[2];
  const bracketStart = rest.indexOf("[");
  const bracketEnd = rest.lastIndexOf("]");
  if (bracketStart === -1 || bracketEnd === -1 || bracketEnd <= bracketStart) {
    throw new Error(
      `${context.moduleCode} Q${context.questionNumber}: quiz line is missing a bracketed option list`
    );
  }

  const question = rest
    .slice(0, bracketStart)
    .replace(/\s*\|\s*$/, "")
    .trim();
  const optionsRaw = rest.slice(bracketStart + 1, bracketEnd);
  const afterBracket = rest.slice(bracketEnd + 1).trim();
  const correctMatch = afterBracket.match(/^\|\s*correct:\s*(.+)$/i);
  if (!correctMatch) {
    throw new Error(
      `${context.moduleCode} Q${context.questionNumber}: quiz line is missing "| correct: ..."`
    );
  }

  const optionLabels = optionsRaw
    .split("|")
    .map((option) => option.trim())
    .filter(Boolean);

  if (optionLabels.length !== 4) {
    throw new Error(
      `${context.moduleCode} Q${context.questionNumber}: expected 4 options, got ${optionLabels.length}`
    );
  }

  const options = optionLabels.map((label, index) => ({
    id: String(index),
    label,
  }));

  const correctLabel = correctMatch[1].trim();
  const correctOption = resolveCorrectOption(options, correctLabel, {
    moduleCode: context.moduleCode,
    questionNumber: Number(questionNumberMatch[1]) || context.questionNumber,
  });

  return {
    question,
    options,
    correct_answer: correctOption.id,
  };
}

export function assertQuizBank(modules: ParsedWorkbookModule[]): void {
  if (modules.length !== 14) {
    throw new Error(`Expected 14 modules, parsed ${modules.length}`);
  }

  let totalQuestions = 0;
  for (const module of modules) {
    for (const [index, question] of module.quiz.entries()) {
      totalQuestions += 1;
      const questionNumber = index + 1;
      if (question.options.length !== 4) {
        throw new Error(
          `${module.module_code} Q${questionNumber}: expected 4 options, got ${question.options.length}`
        );
      }

      const correctOption = question.options.find(
        (option) => option.id === question.correct_answer
      );
      if (!correctOption) {
        throw new Error(
          `${module.module_code} Q${questionNumber}: correct_answer id "${question.correct_answer}" is invalid`
        );
      }
    }
  }

  if (totalQuestions !== 56) {
    throw new Error(`Expected 56 quiz questions, parsed ${totalQuestions}`);
  }
}

function extractSection(body: string, name: string): string {
  const regex = new RegExp(
    `### ${name}\\s*\\n([\\s\\S]*?)(?=\\n### |\\n---\\s*\\n|$)`,
    "i"
  );
  const match = body.match(regex);
  return match ? match[1].trim() : "";
}

function parseBullets(section: string): string[] {
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
}

function parseNumberedLines(section: string): string[] {
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\./.test(line));
}

export function parseWorkbookSeedMarkdown(markdown: string): ParsedWorkbookModule[] {
  const chunks = markdown.split(/\n---\n/).filter((chunk) =>
    /\*\*slug:\*\*/.test(chunk)
  );

  const modules: ParsedWorkbookModule[] = [];

  for (const chunk of chunks) {
    const codeMatch = chunk.match(/^##\s+(P\d+)\s+—/m);
    const slugMatch = chunk.match(/\*\*slug:\*\*\s*`([^`]+)`/);
    if (!codeMatch || !slugMatch) continue;

    const weekMatch = chunk.match(/\*\*unlock_week:\*\*\s*(\d+)/);
    const unlock_week = weekMatch ? Number(weekMatch[1]) : 1;

    const overview = extractSection(chunk, "overview");
    const conceptsSection = extractSection(chunk, "concepts");
    const frameworksSection = extractSection(chunk, "frameworks");
    const exercisesSection = extractSection(chunk, "exercises");
    const applicationSection = extractSection(chunk, "application");
    const completionSection = extractSection(chunk, "completion_check");
    const quizSection = extractSection(chunk, "quiz");

    const concepts = parseNumberedLines(conceptsSection)
      .map(parseNumberedConcept)
      .filter((c): c is { heading: string; body: string } => c !== null);

    const frameworks = parseNumberedLines(frameworksSection)
      .map(parseNumberedConcept)
      .map((c) => ({ name: c!.heading, body: c!.body }))
      .filter((f) => f.name);

    const exercises = parseNumberedLines(exercisesSection)
      .map(parseExerciseLine)
      .filter((e): e is ParsedExercise => e !== null);

    const quizLines = parseNumberedLines(quizSection);
    const quiz = quizLines.map((line, index) =>
      parseQuizLine(line, {
        moduleCode: codeMatch[1],
        questionNumber: index + 1,
      })
    );

    modules.push({
      module_code: codeMatch[1],
      slug: slugMatch[1],
      unlock_week,
      overview,
      concepts,
      frameworks,
      exercises,
      application: parseBullets(applicationSection),
      completion_check: parseBullets(completionSection),
      quiz,
    });
  }

  return modules;
}

export function toWorkbookBlocks(module: ParsedWorkbookModule): WorkbookBlock[] {
  const blocks: WorkbookBlock[] = [];

  for (const concept of module.concepts) {
    blocks.push({
      type: "concept_block",
      title: concept.heading,
      body: concept.body,
    });
  }

  for (const framework of module.frameworks) {
    blocks.push({
      type: "framework_callout",
      title: framework.name,
      body: framework.body,
    });
  }

  if (module.application.length > 0) {
    blocks.push({ type: "heading", level: 2, text: "Real-World Application" });
    blocks.push({
      type: "application",
      items: module.application,
    });
  }

  return blocks;
}

export function toDbWorkbookContent(module: ParsedWorkbookModule) {
  return {
    estimated_minutes: 45,
    overview: module.overview,
    blocks: toWorkbookBlocks(module),
    completion_check: module.completion_check,
  };
}

export function toDbExercises(module: ParsedWorkbookModule) {
  return module.exercises.map((exercise) => ({
    key: exercise.key,
    title: exercise.title,
    label: exercise.label,
    instructions: exercise.instructions,
    input_type: exercise.input_type,
    fields: exercise.fields,
    ...(exercise.options?.length ? { options: exercise.options } : {}),
  }));
}

export function loadWorkbookSeedFromFile(
  filePath = join(process.cwd(), "workbook-content-seed.md")
): ParsedWorkbookModule[] {
  const markdown = readFileSync(filePath, "utf8");
  const modules = parseWorkbookSeedMarkdown(markdown);
  assertQuizBank(modules);
  return modules;
}
