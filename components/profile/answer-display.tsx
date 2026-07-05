import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import {
  type ExerciseAnswerData,
  fillBlankValueKeys,
  getBoolValue,
  getNumberValue,
  getStringValue,
  groupAnchorPairs,
  groupRewritePairs,
  groupTierFields,
  parseFillBlankParts,
  scoreFieldKeys,
  starFieldMap,
} from "@/lib/exercise-answers";
import type { ExerciseFieldPrompt, ExerciseInputType } from "@/types/modules";
import { cn } from "@/lib/utils";

type AnswerDisplayProps = {
  inputType: ExerciseInputType;
  exerciseKey: string;
  fields: ExerciseFieldPrompt[];
  answer: ExerciseAnswerData;
};

function ReflectionDisplay({
  fields,
  answer,
}: {
  fields: ExerciseFieldPrompt[];
  answer: ExerciseAnswerData;
}) {
  return (
    <div className="space-y-3">
      {fields.map((field) => {
        const text = getStringValue(answer, field.key).trim();
        if (!text) return null;
        return (
          <div key={field.key} className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {field.label}
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
          </div>
        );
      })}
    </div>
  );
}

function FillBlankDisplay({
  exerciseKey,
  fields,
  answer,
}: {
  exerciseKey: string;
  fields: ExerciseFieldPrompt[];
  answer: ExerciseAnswerData;
}) {
  const template = fields[0]?.label ?? "";
  const parts = parseFillBlankParts(template);
  const blankKeys = fillBlankValueKeys(exerciseKey, fields);
  const usesTemplateBlanks = parts.length > 1;

  if (!usesTemplateBlanks) {
    return <ReflectionDisplay fields={fields} answer={answer} />;
  }

  return (
    <p className="text-sm leading-relaxed">
      {parts.map((part, index) => (
        <span key={index}>
          {part ? <span>{part}</span> : null}
          {index < parts.length - 1 ? (
            <span className="mx-0.5 font-semibold underline decoration-accent/60 underline-offset-2">
              {getStringValue(answer, blankKeys[index]) || "…"}
            </span>
          ) : null}
        </span>
      ))}
    </p>
  );
}

function RewritePairsDisplay({
  fields,
  answer,
}: {
  fields: ExerciseFieldPrompt[];
  answer: ExerciseAnswerData;
}) {
  const pairs = groupRewritePairs(fields);

  if (pairs.length === 0) {
    return <ReflectionDisplay fields={fields} answer={answer} />;
  }

  return (
    <div className="space-y-3">
      {pairs.map((pair) => {
        const before = getStringValue(answer, pair.beforeKey).trim();
        const after = getStringValue(answer, pair.afterKey).trim();
        if (!before && !after) return null;
        return (
          <div
            key={pair.index}
            className="grid gap-2 rounded-lg border border-border/70 p-3 sm:grid-cols-[1fr_auto_1fr]"
          >
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {pair.beforeLabel}
              </p>
              <p className="whitespace-pre-wrap text-sm">{before || "—"}</p>
            </div>
            <span className="hidden self-center text-muted-foreground sm:block">→</span>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {pair.afterLabel}
              </p>
              <p className="whitespace-pre-wrap text-sm">{after || "—"}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AnchorSelectDisplay({
  fields,
  answer,
}: {
  fields: ExerciseFieldPrompt[];
  answer: ExerciseAnswerData;
}) {
  const pairs = groupAnchorPairs(fields);
  const selections = pairs
    .map((pair) => ({
      label: getStringValue(answer, pair.anchorKey).trim(),
      reason: getStringValue(answer, pair.reasonKey).trim(),
    }))
    .filter((selection) => selection.label);

  if (selections.length === 0) {
    return <ReflectionDisplay fields={fields} answer={answer} />;
  }

  return (
    <div className="space-y-3">
      {selections.map((selection) => (
        <div key={selection.label} className="space-y-2 rounded-lg border p-3">
          <Badge variant="secondary">{selection.label}</Badge>
          {selection.reason ? (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {selection.reason}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ScorecardDisplay({
  fields,
  answer,
}: {
  fields: ExerciseFieldPrompt[];
  answer: ExerciseAnswerData;
}) {
  const total = fields.reduce((sum, field) => {
    const { score } = scoreFieldKeys(field.key);
    return sum + getNumberValue(answer, score);
  }, 0);
  const maxTotal = fields.length * 5;

  return (
    <div className="space-y-3">
      {fields.map((field) => {
        const { score, notes } = scoreFieldKeys(field.key);
        const scoreValue = getNumberValue(answer, score);
        const notesValue = getStringValue(answer, notes).trim();
        if (scoreValue === 0 && !notesValue) return null;
        return (
          <div
            key={field.key}
            className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_4rem_1fr]"
          >
            <p className="self-center text-sm font-medium">{field.label}</p>
            <p className="self-center text-sm font-semibold tabular-nums">
              {scoreValue || "—"}
            </p>
            <p className="self-center text-sm text-muted-foreground">
              {notesValue || "—"}
            </p>
          </div>
        );
      })}
      <p className="text-sm font-medium">
        Total: {total} / {maxTotal}
      </p>
    </div>
  );
}

function StarDisplay({
  fields,
  answer,
}: {
  fields: ExerciseFieldPrompt[];
  answer: ExerciseAnswerData;
}) {
  const map = starFieldMap(fields);
  const labels: Record<keyof typeof map, string> = {
    situation: "Situation",
    task: "Task",
    action: "Action",
    result: "Result + Learning",
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(Object.entries(map) as [keyof typeof map, string][]).map(
        ([labelKey, fieldKey]) => {
          const text = getStringValue(answer, fieldKey).trim();
          if (!text) return null;
          return (
            <div key={fieldKey} className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {labels[labelKey]}
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
            </div>
          );
        }
      )}
    </div>
  );
}

function ChecklistDisplay({
  fields,
  answer,
}: {
  fields: ExerciseFieldPrompt[];
  answer: ExerciseAnswerData;
}) {
  const checked = fields.filter((field) => getBoolValue(answer, field.key));
  if (checked.length === 0) return null;

  return (
    <ul className="space-y-2">
      {checked.map((field) => (
        <li key={field.key} className="flex items-start gap-2 text-sm">
          <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <span>{field.label}</span>
        </li>
      ))}
    </ul>
  );
}

function TierMapDisplay({
  fields,
  answer,
}: {
  fields: ExerciseFieldPrompt[];
  answer: ExerciseAnswerData;
}) {
  const tiers = groupTierFields(fields);

  return (
    <div className="space-y-4">
      {tiers.map((tier) => {
        const tierFields = tier.fields.filter((field) =>
          getStringValue(answer, field.key).trim()
        );
        if (tierFields.length === 0) return null;
        return (
          <div key={tier.tierLabel} className="space-y-2 rounded-lg border p-3">
            <p className="text-sm font-semibold">{tier.tierLabel}</p>
            {tierFields.map((field) => (
              <div key={field.key} className="space-y-1">
                <p className="text-xs text-muted-foreground">{field.label}</p>
                <p className="whitespace-pre-wrap text-sm">
                  {getStringValue(answer, field.key)}
                </p>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function AnswerDisplay({
  inputType,
  exerciseKey,
  fields,
  answer,
}: AnswerDisplayProps) {
  const content = (() => {
    switch (inputType) {
      case "reflection":
        return <ReflectionDisplay fields={fields} answer={answer} />;
      case "fill_blank":
        return (
          <FillBlankDisplay
            exerciseKey={exerciseKey}
            fields={fields}
            answer={answer}
          />
        );
      case "rewrite_pairs":
        return <RewritePairsDisplay fields={fields} answer={answer} />;
      case "anchor_select":
        return <AnchorSelectDisplay fields={fields} answer={answer} />;
      case "scorecard":
        return <ScorecardDisplay fields={fields} answer={answer} />;
      case "star":
        return <StarDisplay fields={fields} answer={answer} />;
      case "checklist":
        return <ChecklistDisplay fields={fields} answer={answer} />;
      case "tier_map":
        return <TierMapDisplay fields={fields} answer={answer} />;
      default:
        return <ReflectionDisplay fields={fields} answer={answer} />;
    }
  })();

  return <div className={cn("text-foreground")}>{content}</div>;
}
