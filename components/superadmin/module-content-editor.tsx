"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateModuleContent,
  saveQuizQuestions,
} from "@/app/actions/content-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ExerciseField, WorkbookBlock } from "@/types/modules";
import { isStructuredExercise } from "@/types/modules";

type LegacyExerciseField = Extract<
  ExerciseField,
  { type: "text" | "choice" | "checkbox" }
>;

type LegacyExerciseType = LegacyExerciseField["type"];

type QuizQuestion = {
  id?: string;
  question: string;
  options: { id: string; label: string }[];
  correct_answer: string;
  order_index: number;
};

type ModuleContentEditorProps = {
  moduleId: string;
  moduleCode: string;
  title: string;
  initialVideoUrl: string;
  initialDescription: string;
  initialWorkbook: { estimated_minutes: number; blocks: WorkbookBlock[] };
  initialExercises: ExerciseField[];
  initialQuiz: QuizQuestion[];
};

const BLOCK_TYPES = [
  "heading",
  "paragraph",
  "framework_callout",
  "concept_block",
] as const;

export function ModuleContentEditor({
  moduleId,
  moduleCode,
  title,
  initialVideoUrl,
  initialDescription,
  initialWorkbook,
  initialExercises,
  initialQuiz,
}: ModuleContentEditorProps) {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl);
  const [description, setDescription] = useState(initialDescription);
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    initialWorkbook.estimated_minutes
  );
  const [blocks, setBlocks] = useState<WorkbookBlock[]>(
    initialWorkbook.blocks
  );
  const [exercises, setExercises] = useState<ExerciseField[]>(initialExercises);
  const [quiz, setQuiz] = useState<QuizQuestion[]>(initialQuiz);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.set("moduleId", moduleId);
      formData.set("videoUrl", videoUrl);
      formData.set("description", description);
      formData.set(
        "workbookJson",
        JSON.stringify({ estimated_minutes: estimatedMinutes, blocks })
      );
      formData.set("exercisesJson", JSON.stringify(exercises));
      await updateModuleContent(formData);
      await saveQuizQuestions(moduleId, JSON.stringify(quiz));
      setMessage("Saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function addBlock(type: (typeof BLOCK_TYPES)[number]) {
    if (type === "heading") {
      setBlocks((b) => [...b, { type, level: 2, text: "" }]);
      return;
    }
    if (type === "paragraph") {
      setBlocks((b) => [...b, { type, text: "" }]);
      return;
    }
    setBlocks((b) => [...b, { type, title: "", body: "" }]);
  }

  function addExercise() {
    setExercises((e) => [
      ...e,
      {
        key: `exercise_${e.length + 1}`,
        type: "text",
        label: "",
        instructions: "",
      },
    ]);
  }

  function addQuizQuestion() {
    setQuiz((q) => [
      ...q,
      {
        question: "",
        options: [
          { id: "a", label: "" },
          { id: "b", label: "" },
          { id: "c", label: "" },
          { id: "d", label: "" },
        ],
        correct_answer: "a",
        order_index: q.length + 1,
      },
    ]);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">{moduleCode}</p>
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>

      <section className="space-y-4 rounded-xl border border-border p-4">
        <h2 className="font-semibold">Video & description</h2>
        <div className="space-y-2">
          <Label htmlFor="videoUrl">Video URL (YouTube or Vimeo)</Label>
          <Input
            id="videoUrl"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold">Workbook content</h2>
          <div className="flex flex-wrap gap-2">
            {BLOCK_TYPES.map((type) => (
              <Button
                key={type}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addBlock(type)}
              >
                + {type}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Estimated minutes</Label>
          <Input
            type="number"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            className="w-32"
          />
        </div>
        {blocks.map((block, index) => (
          <div key={index} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                {block.type}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setBlocks((b) => b.filter((_, i) => i !== index))
                }
              >
                Remove
              </Button>
            </div>
            {block.type === "heading" && (
              <>
                <select
                  value={block.level}
                  onChange={(e) =>
                    setBlocks((b) =>
                      b.map((item, i) =>
                        i === index && item.type === "heading"
                          ? { ...item, level: Number(e.target.value) as 2 | 3 }
                          : item
                      )
                    )
                  }
                  className="h-9 rounded-md border px-2 text-sm"
                >
                  <option value={2}>H2</option>
                  <option value={3}>H3</option>
                </select>
                <Textarea
                  value={block.text}
                  onChange={(e) =>
                    setBlocks((b) =>
                      b.map((item, i) =>
                        i === index && item.type === "heading"
                          ? { ...item, text: e.target.value }
                          : item
                      )
                    )
                  }
                  rows={2}
                />
              </>
            )}
            {block.type === "paragraph" && (
              <Textarea
                value={block.text}
                onChange={(e) =>
                  setBlocks((b) =>
                    b.map((item, i) =>
                      i === index && item.type === "paragraph"
                        ? { ...item, text: e.target.value }
                        : item
                    )
                  )
                }
                rows={4}
              />
            )}
            {(block.type === "framework_callout" ||
              block.type === "concept_block" ||
              block.type === "callout") && (
              <>
                <Input
                  value={block.title}
                  placeholder="Title"
                  onChange={(e) =>
                    setBlocks((b) =>
                      b.map((item, i) =>
                        i === index &&
                        (item.type === "framework_callout" ||
                          item.type === "concept_block" ||
                          item.type === "callout")
                          ? { ...item, title: e.target.value }
                          : item
                      )
                    )
                  }
                />
                <Textarea
                  value={block.body}
                  placeholder="Body"
                  onChange={(e) =>
                    setBlocks((b) =>
                      b.map((item, i) =>
                        i === index &&
                        (item.type === "framework_callout" ||
                          item.type === "concept_block" ||
                          item.type === "callout")
                          ? { ...item, body: e.target.value }
                          : item
                      )
                    )
                  }
                  rows={4}
                />
              </>
            )}
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Exercises</h2>
          <Button type="button" variant="secondary" size="sm" onClick={addExercise}>
            + Exercise
          </Button>
        </div>
        {exercises.map((exercise, index) => (
          <div key={index} className="space-y-2 rounded-lg border p-3">
            {isStructuredExercise(exercise) ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {exercise.key}
                  </span>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                    {exercise.input_type}
                  </span>
                </div>
                <p className="text-sm font-medium">{exercise.title}</p>
                <p className="text-sm text-muted-foreground">
                  {exercise.instructions}
                </p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {exercise.fields.map((field) => (
                    <li key={field.key}>{field.label}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  Structured exercises are seeded from the workbook — edit via
                  re-seed, not this form.
                </p>
              </>
            ) : (
              <>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={exercise.key}
                placeholder="key"
                onChange={(e) =>
                  setExercises((items) =>
                    items.map((item, i) =>
                      i === index ? { ...item, key: e.target.value } : item
                    )
                  )
                }
              />
              <select
                value={exercise.type}
                onChange={(e) => {
                  const type = e.target.value as LegacyExerciseType;
                  setExercises((items) =>
                    items.map((item, i) => {
                      if (i !== index || isStructuredExercise(item)) return item;
                      if (type === "choice") {
                        return {
                          key: item.key,
                          type,
                          label: item.label,
                          instructions: item.instructions,
                          options: ["Option 1", "Option 2"],
                        };
                      }
                      if (type === "checkbox") {
                        return {
                          key: item.key,
                          type,
                          label: item.label,
                          instructions: item.instructions,
                        };
                      }
                      return {
                        key: item.key,
                        type: "text",
                        label: item.label,
                        instructions: item.instructions,
                      };
                    })
                  );
                }}
                className="h-9 rounded-md border px-2 text-sm"
              >
                <option value="text">text</option>
                <option value="choice">radio</option>
                <option value="checkbox">checklist</option>
              </select>
            </div>
            <Input
              value={exercise.label}
              placeholder="Label"
              onChange={(e) =>
                setExercises((items) =>
                  items.map((item, i) =>
                    i === index ? { ...item, label: e.target.value } : item
                  )
                )
              }
            />
            <Textarea
              value={exercise.instructions ?? ""}
              placeholder="Instructions"
              onChange={(e) =>
                setExercises((items) =>
                  items.map((item, i) =>
                    i === index
                      ? { ...item, instructions: e.target.value }
                      : item
                  )
                )
              }
              rows={2}
            />
            {exercise.type === "choice" && (
              <Textarea
                value={exercise.options.join("\n")}
                placeholder="One option per line"
                onChange={(e) =>
                  setExercises((items) =>
                    items.map((item, i) => {
                      if (i !== index || isStructuredExercise(item)) return item;
                      if (item.type !== "choice") return item;
                      return {
                        ...item,
                        options: e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      };
                    })
                  )
                }
                rows={4}
              />
            )}
              </>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setExercises((items) => items.filter((_, i) => i !== index))
              }
            >
              Remove
            </Button>
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Quiz (5 questions recommended)</h2>
          <Button type="button" variant="secondary" size="sm" onClick={addQuizQuestion}>
            + Question
          </Button>
        </div>
        {quiz.map((question, qIndex) => (
          <div key={qIndex} className="space-y-2 rounded-lg border p-3">
            <Textarea
              value={question.question}
              placeholder="Question"
              onChange={(e) =>
                setQuiz((items) =>
                  items.map((item, i) =>
                    i === qIndex ? { ...item, question: e.target.value } : item
                  )
                )
              }
              rows={2}
            />
            {question.options.map((option, oIndex) => (
              <Input
                key={option.id}
                value={option.label}
                placeholder={`Option ${option.id}`}
                onChange={(e) =>
                  setQuiz((items) =>
                    items.map((item, i) =>
                      i === qIndex
                        ? {
                            ...item,
                            options: item.options.map((opt, j) =>
                              j === oIndex
                                ? { ...opt, label: e.target.value }
                                : opt
                            ),
                          }
                        : item
                    )
                  )
                }
              />
            ))}
            <div className="flex items-center gap-2">
              <Label>Correct answer</Label>
              <select
                value={question.correct_answer}
                onChange={(e) =>
                  setQuiz((items) =>
                    items.map((item, i) =>
                      i === qIndex
                        ? { ...item, correct_answer: e.target.value }
                        : item
                    )
                  )
                }
                className="h-9 rounded-md border px-2 text-sm"
              >
                {question.options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.id}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setQuiz((items) => items.filter((_, i) => i !== qIndex))
                }
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-accent">{message}</p>}

      <Button type="button" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save module content"}
      </Button>
    </div>
  );
}
