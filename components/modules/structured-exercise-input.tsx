"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { ExerciseFieldPrompt, ExerciseInputType } from "@/types/modules";
import {
  type AnchorPair,
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
import { cn } from "@/lib/utils";

type StructuredExerciseInputProps = {
  inputType: ExerciseInputType;
  exerciseKey: string;
  fields: ExerciseFieldPrompt[];
  options?: string[];
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

type AnchorSelection = {
  anchorKey: string;
  reasonKey: string;
  label: string;
  reason: string;
};

function readAnchorSelections(
  value: ExerciseAnswerData,
  pairs: AnchorPair[]
): AnchorSelection[] {
  return pairs
    .map((pair) => ({
      anchorKey: pair.anchorKey,
      reasonKey: pair.reasonKey,
      label: getStringValue(value, pair.anchorKey),
      reason: getStringValue(value, pair.reasonKey),
    }))
    .filter((selection) => selection.label.trim());
}

function writeAnchorSelections(
  value: ExerciseAnswerData,
  pairs: AnchorPair[],
  selections: Pick<AnchorSelection, "label" | "reason">[],
  onChange: (next: ExerciseAnswerData) => void
) {
  const nextValues = { ...value.values };
  for (const pair of pairs) {
    delete nextValues[pair.anchorKey];
    delete nextValues[pair.reasonKey];
  }
  selections.slice(0, pairs.length).forEach((selection, index) => {
    nextValues[pairs[index].anchorKey] = selection.label;
    nextValues[pairs[index].reasonKey] = selection.reason;
  });
  onChange({ values: nextValues });
}

type AnchorSelectChipsProps = {
  pairs: AnchorPair[];
  options: string[];
  value: ExerciseAnswerData;
  onChange: (next: ExerciseAnswerData) => void;
  disabled?: boolean;
};

function AnchorSelectChips({
  pairs,
  options,
  value,
  onChange,
  disabled,
}: AnchorSelectChipsProps) {
  const selections = readAnchorSelections(value, pairs);
  const maxSelections = pairs.length;
  const atMax = selections.length >= maxSelections;

  function toggleOption(option: string) {
    const existing = selections.find((selection) => selection.label === option);
    if (existing) {
      writeAnchorSelections(
        value,
        pairs,
        selections
          .filter((selection) => selection.label !== option)
          .map(({ label, reason }) => ({ label, reason })),
        onChange
      );
      return;
    }
    if (atMax) return;
    writeAnchorSelections(
      value,
      pairs,
      [...selections, { label: option, reason: "" }].map(({ label, reason }) => ({
        label,
        reason,
      })),
      onChange
    );
  }

  function updateReason(option: string, reason: string) {
    writeAnchorSelections(
      value,
      pairs,
      selections.map((selection) =>
        selection.label === option ? { ...selection, reason } : selection
      ),
      onChange
    );
  }

  function removeSelection(label: string) {
    writeAnchorSelections(
      value,
      pairs,
      selections
        .filter((selection) => selection.label !== label)
        .map(({ label: anchorLabel, reason }) => ({ label: anchorLabel, reason })),
      onChange
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selections.some((selection) => selection.label === option);
          return (
            <Button
              key={option}
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled || (atMax && !isSelected)}
              className={cn(
                "h-auto whitespace-normal px-3 py-1.5 text-left anchor-chip",
                isSelected && "anchor-chip-selected"
              )}
              onClick={() => toggleOption(option)}
            >
              {option}
            </Button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Select up to {maxSelections} anchors ({selections.length}/{maxSelections} selected)
      </p>
      {selections.map((selection) => (
        <div
          key={selection.label}
          className="relative space-y-2 rounded-lg border p-3 pr-10"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 size-7"
            disabled={disabled}
            aria-label={`Remove ${selection.label}`}
            onClick={() => removeSelection(selection.label)}
          >
            <X className="size-4" />
          </Button>
          <Label className="text-sm font-medium">{selection.label}</Label>
          <Textarea
            value={selection.reason}
            onChange={(e) => updateReason(selection.label, e.target.value)}
            placeholder="Why this anchor matters to you"
            rows={2}
            disabled={disabled}
          />
        </div>
      ))}
    </div>
  );
}

export function StructuredExerciseInput({
  inputType,
  exerciseKey,
  fields,
  options,
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
      const blankKeys = fillBlankValueKeys(exerciseKey, fields);
      const usesTemplateBlanks = parts.length > 1;

      return (
        <div className="space-y-3">
          {usesTemplateBlanks ? (
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
        : fields.filter((field) => !field.key.toLowerCase().startsWith("reason"));

      if (options?.length && pairs.length > 0) {
        return (
          <AnchorSelectChips
            pairs={pairs}
            options={options}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );
      }

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
