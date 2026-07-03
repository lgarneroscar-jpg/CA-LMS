"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { ExerciseFieldPrompt, ExerciseInputType } from "@/types/modules";
import {
  type ExerciseAnswerData,
  blankKeysForTemplate,
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

type StructuredExerciseInputProps = {
  inputType: ExerciseInputType;
  exerciseKey: string;
  fields: ExerciseFieldPrompt[];
  value: ExerciseAnswerData;
  onChange: (next: ExerciseAnswerData) => void;
  disabled?: boolean;
};

function setString(
  value: ExerciseAnswerData,
  key: string,
  next: string,
  onChange: (next: ExerciseAnswerData) => void
) {
  onChange({ values: { ...value.values, [key]: next } });
}

function setBool(
  value: ExerciseAnswerData,
  key: string,
  next: boolean,
  onChange: (next: ExerciseAnswerData) => void
) {
  onChange({ values: { ...value.values, [key]: next } });
}

function setNumber(
  value: ExerciseAnswerData,
  key: string,
  next: number,
  onChange: (next: ExerciseAnswerData) => void
) {
  onChange({ values: { ...value.values, [key]: next } });
}

export function StructuredExerciseInput({
  inputType,
  exerciseKey,
  fields,
  value,
  onChange,
  disabled,
}: StructuredExerciseInputProps) {
  switch (inputType) {
    case "reflection":
      return (
        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-sm font-medium">{field.label}</Label>
              <Textarea
                value={getStringValue(value, field.key)}
                onChange={(e) => setString(value, field.key, e.target.value, onChange)}
                rows={4}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      );

    case "fill_blank": {
      const template = fields[0]?.label ?? "";
      const parts = parseFillBlankParts(template);
      const blankCount = Math.max(parts.length - 1, fields.length);
      const blankKeys =
        blankCount > 0 && parts.length > 1
          ? blankKeysForTemplate(exerciseKey, blankCount)
          : fields.map((f) => f.key);

      return (
        <div className="space-y-3">
          {parts.length > 1 ? (
            <div className="flex flex-wrap items-center gap-2 text-sm leading-relaxed">
              {parts.map((part, index) => (
                <span key={index} className="inline-flex items-center gap-2">
                  {part ? <span className="text-foreground">{part}</span> : null}
                  {index < parts.length - 1 ? (
                    <Input
                      value={getStringValue(value, blankKeys[index])}
                      onChange={(e) =>
                        setString(value, blankKeys[index], e.target.value, onChange)
                      }
                      disabled={disabled}
                      className="inline-flex h-8 min-w-[8rem] max-w-full"
                      placeholder="…"
                    />
                  ) : null}
                </span>
              ))}
            </div>
          ) : (
            fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-sm font-medium">{field.label}</Label>
                <Input
                  value={getStringValue(value, field.key)}
                  onChange={(e) => setString(value, field.key, e.target.value, onChange)}
                  disabled={disabled}
                />
              </div>
            ))
          )}
        </div>
      );
    }

    case "rewrite_pairs": {
      const pairs = groupRewritePairs(fields);
      return (
        <div className="space-y-4">
          {pairs.map((pair) => (
            <div
              key={pair.index}
              className="grid gap-3 rounded-lg border border-border/70 p-3 sm:grid-cols-2"
            >
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {pair.beforeLabel}
                </Label>
                <Textarea
                  value={getStringValue(value, pair.beforeKey)}
                  onChange={(e) =>
                    setString(value, pair.beforeKey, e.target.value, onChange)
                  }
                  rows={3}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {pair.afterLabel}
                </Label>
                <Textarea
                  value={getStringValue(value, pair.afterKey)}
                  onChange={(e) =>
                    setString(value, pair.afterKey, e.target.value, onChange)
                  }
                  rows={3}
                  disabled={disabled}
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    case "anchor_select": {
      const pairs = groupAnchorPairs(fields);
      const fallbackFields = pairs.length
        ? null
        : fields.filter((f) => !f.key.toLowerCase().startsWith("reason"));

      return (
        <div className="space-y-4">
          {(pairs.length ? pairs : []).map((pair) => (
            <div key={pair.index} className="space-y-2 rounded-lg border p-3">
              <Label className="text-sm font-medium">Anchor {pair.index}</Label>
              <Input
                value={getStringValue(value, pair.anchorKey)}
                onChange={(e) =>
                  setString(value, pair.anchorKey, e.target.value, onChange)
                }
                placeholder="Your chosen identity anchor"
                disabled={disabled}
              />
              <Textarea
                value={getStringValue(value, pair.reasonKey)}
                onChange={(e) =>
                  setString(value, pair.reasonKey, e.target.value, onChange)
                }
                placeholder="Why this anchor matters to you"
                rows={2}
                disabled={disabled}
              />
            </div>
          ))}
          {fallbackFields?.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-sm font-medium">{field.label}</Label>
              <Textarea
                value={getStringValue(value, field.key)}
                onChange={(e) => setString(value, field.key, e.target.value, onChange)}
                rows={3}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      );
    }

    case "star": {
      const map = starFieldMap(fields);
      const labels: Record<string, string> = {
        situation: "Situation",
        task: "Task",
        action: "Action",
        result: "Result + Learning",
      };
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.entries(map) as [keyof typeof map, string][]).map(
            ([labelKey, fieldKey]) => (
              <div key={fieldKey} className="space-y-1.5">
                <Label className="text-sm font-medium">{labels[labelKey]}</Label>
                <Textarea
                  value={getStringValue(value, fieldKey)}
                  onChange={(e) => setString(value, fieldKey, e.target.value, onChange)}
                  rows={labelKey === "result" ? 4 : 3}
                  disabled={disabled}
                />
              </div>
            )
          )}
        </div>
      );
    }

    case "checklist":
      return (
        <div className="space-y-2">
          {fields.map((field) => (
            <div key={field.key} className="flex items-start gap-3">
              <Checkbox
                id={field.key}
                checked={getBoolValue(value, field.key)}
                onCheckedChange={(checked) =>
                  setBool(value, field.key, checked === true, onChange)
                }
                disabled={disabled}
              />
              <Label htmlFor={field.key} className="font-normal leading-snug">
                {field.label}
              </Label>
            </div>
          ))}
        </div>
      );

    case "tier_map": {
      const tiers = groupTierFields(fields);
      return (
        <div className="space-y-4">
          {tiers.map((tier) => (
            <div key={tier.tierLabel} className="space-y-2 rounded-lg border p-3">
              <p className="text-sm font-semibold">{tier.tierLabel}</p>
              {tier.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{field.label}</Label>
                  <Textarea
                    value={getStringValue(value, field.key)}
                    onChange={(e) => setString(value, field.key, e.target.value, onChange)}
                    rows={3}
                    disabled={disabled}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    case "scorecard": {
      const total = fields.reduce((sum, field) => {
        const { score } = scoreFieldKeys(field.key);
        return sum + getNumberValue(value, score);
      }, 0);
      const maxTotal = fields.length * 5;

      return (
        <div className="space-y-3">
          {fields.map((field) => {
            const { score, notes } = scoreFieldKeys(field.key);
            return (
              <div
                key={field.key}
                className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_5rem_1fr]"
              >
                <Label className="self-center text-sm font-medium">{field.label}</Label>
                <select
                  value={getNumberValue(value, score) || ""}
                  onChange={(e) =>
                    setNumber(value, score, Number(e.target.value) || 0, onChange)
                  }
                  disabled={disabled}
                  className="h-9 rounded-md border px-2 text-sm"
                >
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <Input
                  value={getStringValue(value, notes)}
                  onChange={(e) => setString(value, notes, e.target.value, onChange)}
                  placeholder="Notes"
                  disabled={disabled}
                />
              </div>
            );
          })}
          <p className="text-sm font-medium text-foreground">
            Total: {total} / {maxTotal}
          </p>
        </div>
      );
    }

    default:
      return (
        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-sm font-medium">{field.label}</Label>
              <Textarea
                value={getStringValue(value, field.key)}
                onChange={(e) => setString(value, field.key, e.target.value, onChange)}
                rows={3}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      );
  }
}
