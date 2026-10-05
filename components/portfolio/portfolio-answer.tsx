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

type Props = {
  inputType: ExerciseInputType;
  exerciseKey: string;
  fields: ExerciseFieldPrompt[];
  answer: ExerciseAnswerData;
};

function Prompt({ children }: { children: React.ReactNode }) {
  return (
    <p className="portfolio-prompt break-after-avoid text-[0.8rem] font-semibold text-neutral-700">
      {children}
    </p>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed text-black">
      {children}
    </p>
  );
}

function Labelled({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div className="space-y-1">
      <Prompt>{label}</Prompt>
      <Prose>{text}</Prose>
    </div>
  );
}

function Reflection({ fields, answer }: Omit<Props, "inputType" | "exerciseKey">) {
  return (
    <>
      {fields.map((field) => (
        <Labelled
          key={field.key}
          label={field.label}
          text={getStringValue(answer, field.key).trim()}
        />
      ))}
    </>
  );
}

function FillBlank({ exerciseKey, fields, answer }: Omit<Props, "inputType">) {
  const parts = parseFillBlankParts(fields[0]?.label ?? "");
  if (parts.length <= 1) return <Reflection fields={fields} answer={answer} />;
  const blankKeys = fillBlankValueKeys(exerciseKey, fields);
  return (
    <p className="text-[0.95rem] leading-relaxed text-black">
      {parts.map((part, index) => (
        <span key={index}>
          {part}
          {index < parts.length - 1 ? (
            <strong className="font-semibold">
              {getStringValue(answer, blankKeys[index]).trim() || "…"}
            </strong>
          ) : null}
        </span>
      ))}
    </p>
  );
}

function RewritePairs({ fields, answer }: Omit<Props, "inputType" | "exerciseKey">) {
  const pairs = groupRewritePairs(fields);
  if (pairs.length === 0) return <Reflection fields={fields} answer={answer} />;
  return (
    <>
      {pairs.map((pair) => {
        const before = getStringValue(answer, pair.beforeKey).trim();
        const after = getStringValue(answer, pair.afterKey).trim();
        if (!before && !after) return null;
        return (
          <div key={pair.index} className="break-inside-avoid space-y-2">
            <Labelled label={pair.beforeLabel} text={before} />
            <Labelled label={pair.afterLabel} text={after} />
          </div>
        );
      })}
    </>
  );
}

function AnchorSelect({ fields, answer }: Omit<Props, "inputType" | "exerciseKey">) {
  const selections = groupAnchorPairs(fields)
    .map((pair) => ({
      label: getStringValue(answer, pair.anchorKey).trim(),
      reason: getStringValue(answer, pair.reasonKey).trim(),
    }))
    .filter((selection) => selection.label);
  if (selections.length === 0) return <Reflection fields={fields} answer={answer} />;
  return (
    <>
      {selections.map((selection) => (
        <div key={selection.label} className="break-inside-avoid space-y-1">
          <Prompt>{selection.label}</Prompt>
          {selection.reason ? <Prose>{selection.reason}</Prose> : null}
        </div>
      ))}
    </>
  );
}

function Scorecard({ fields, answer }: Omit<Props, "inputType" | "exerciseKey">) {
  return (
    <>
      {fields.map((field) => {
        const { score, notes } = scoreFieldKeys(field.key);
        const rating = getNumberValue(answer, score);
        const note = getStringValue(answer, notes).trim();
        if (!rating && !note) return null;
        return (
          <div key={field.key} className="break-inside-avoid space-y-1">
            <Prompt>
              {field.label}
              {rating ? (
                <span className="font-normal text-neutral-600">
                  {" "}
                  — self-rated {rating} of 5
                </span>
              ) : null}
            </Prompt>
            {note ? <Prose>{note}</Prose> : null}
          </div>
        );
      })}
    </>
  );
}

function Star({ fields, answer }: Omit<Props, "inputType" | "exerciseKey">) {
  const map = starFieldMap(fields);
  const labels: Record<keyof typeof map, string> = {
    situation: "Situation",
    task: "Task",
    action: "Action",
    result: "Result and learning",
  };
  return (
    <>
      {(Object.entries(map) as [keyof typeof map, string][]).map(([labelKey, fieldKey]) => (
        <Labelled
          key={fieldKey}
          label={labels[labelKey]}
          text={getStringValue(answer, fieldKey).trim()}
        />
      ))}
    </>
  );
}

function Checklist({ fields, answer }: Omit<Props, "inputType" | "exerciseKey">) {
  const checked = fields.filter((field) => getBoolValue(answer, field.key));
  if (checked.length === 0) return null;
  return (
    <ul className="list-disc space-y-1 pl-5 text-[0.95rem] leading-relaxed text-black">
      {checked.map((field) => (
        <li key={field.key}>{field.label}</li>
      ))}
    </ul>
  );
}

function TierMap({ fields, answer }: Omit<Props, "inputType" | "exerciseKey">) {
  return (
    <>
      {groupTierFields(fields).map((tier) => {
        const filled = tier.fields.filter((field) =>
          getStringValue(answer, field.key).trim()
        );
        if (filled.length === 0) return null;
        return (
          <div key={tier.tierLabel} className="break-inside-avoid space-y-2">
            <p className="break-after-avoid text-[0.9rem] font-semibold text-black">
              {tier.tierLabel}
            </p>
            {filled.map((field) => (
              <Labelled
                key={field.key}
                label={field.label}
                text={getStringValue(answer, field.key).trim()}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}

export function PortfolioAnswer({ inputType, exerciseKey, fields, answer }: Props) {
  const body = (() => {
    switch (inputType) {
      case "fill_blank":
        return <FillBlank exerciseKey={exerciseKey} fields={fields} answer={answer} />;
      case "rewrite_pairs":
        return <RewritePairs fields={fields} answer={answer} />;
      case "anchor_select":
        return <AnchorSelect fields={fields} answer={answer} />;
      case "scorecard":
        return <Scorecard fields={fields} answer={answer} />;
      case "star":
        return <Star fields={fields} answer={answer} />;
      case "checklist":
        return <Checklist fields={fields} answer={answer} />;
      case "tier_map":
        return <TierMap fields={fields} answer={answer} />;
      default:
        return <Reflection fields={fields} answer={answer} />;
    }
  })();
  return <div className="space-y-3">{body}</div>;
}
