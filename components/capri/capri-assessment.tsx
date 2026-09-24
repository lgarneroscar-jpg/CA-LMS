"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveCapriProgress, submitCapri } from "@/app/actions/capri";
import {
  BEHAVIORAL_PROMPT_STEM,
  FREQUENCY_BANDS,
  LIKERT_LABELS,
  PILLAR_NAMES,
  SUBDIMENSION_NAMES,
  type CapriAnswer,
  type CapriItem,
  type CapriPillar,
  type RatingContext,
} from "@/lib/capri/scoring";
import type { AdministrationType } from "@/lib/capri/queries";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  administrationType: AdministrationType;
  items: CapriItem[];
  savedAnswers: CapriAnswer[];
};

type AnswerMap = Record<string, number>;

const key = (itemId: string, context: RatingContext) => `${itemId}:${context}`;

export function CapriAssessment({
  administrationType,
  items,
  savedAnswers,
}: Props) {
  const router = useRouter();

  // Clock reads are impure, so the start time is stamped after mount rather
  // than during render. Duration feeds the speed-running data-quality flag.
  const startedAt = useRef<number | null>(null);
  useEffect(() => {
    if (startedAt.current === null) startedAt.current = Date.now();
  }, []);

  const [answers, setAnswers] = useState<AnswerMap>(() =>
    Object.fromEntries(
      savedAnswers.map((a) => [key(a.itemId, a.ratingContext), a.rawValue])
    )
  );
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // At Week 12 each core item is rated twice: how you are now, and — with the
  // standards you have now — how you actually were in Week 1. The second rating
  // is what makes growth measurable on one consistent ruler.
  const isPost = administrationType === "post";

  const pillars = useMemo(
    () =>
      ([1, 2, 3] as CapriPillar[]).map((pillar) => ({
        pillar,
        items: items
          .filter((i) => i.section === "core" && i.pillar === pillar)
          .sort((a, b) => a.orderIndex - b.orderIndex),
      })),
    [items]
  );

  const behavioralItems = useMemo(
    () =>
      items
        .filter((i) => i.section === "behavioral")
        .sort((a, b) => a.pillar - b.pillar || a.orderIndex - b.orderIndex),
    [items]
  );

  const totalSteps = 5; // intro, three pillars, behavioural block
  const stepItems: CapriItem[] =
    step === 0
      ? []
      : step <= 3
        ? pillars[step - 1].items
        : behavioralItems;

  function setAnswer(itemId: string, context: RatingContext, value: number) {
    setAnswers((prev) => ({ ...prev, [key(itemId, context)]: value }));
    setError(null);
  }

  function toPayload() {
    return Object.entries(answers).map(([composite, rawValue]) => {
      const [itemId, ratingContext] = composite.split(":");
      return {
        itemId,
        ratingContext: ratingContext as RatingContext,
        rawValue,
      };
    });
  }

  function missingOnStep(): CapriItem[] {
    return stepItems.filter((item) => {
      const hasCurrent = answers[key(item.id, "current")] !== undefined;
      const needsRetro = isPost && item.section === "core";
      const hasRetro = answers[key(item.id, "retrospective")] !== undefined;
      return !hasCurrent || (needsRetro && !hasRetro);
    });
  }

  async function advance() {
    const missing = missingOnStep();
    if (missing.length > 0) {
      setError(
        missing.length === stepItems.length
          ? "Please answer the questions on this page before continuing."
          : `${missing.length} question${missing.length === 1 ? "" : "s"} on this page still need${missing.length === 1 ? "s" : ""} an answer.`
      );
      return;
    }

    setBusy(true);
    try {
      if (step > 0) {
        await saveCapriProgress(administrationType, toPayload());
      }
      if (step < totalSteps - 1) {
        setStep((s) => s + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const elapsed =
          startedAt.current === null
            ? null
            : Math.round((Date.now() - startedAt.current) / 1000);
        await submitCapri(administrationType, toPayload(), elapsed);
        router.push("/dashboard");
        router.refresh();
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const answeredCount = items.reduce((count, item) => {
    const needed = isPost && item.section === "core" ? 2 : 1;
    let got = answers[key(item.id, "current")] !== undefined ? 1 : 0;
    if (needed === 2 && answers[key(item.id, "retrospective")] !== undefined) {
      got += 1;
    }
    return count + got;
  }, 0);

  const totalRatings = items.reduce(
    (count, item) => count + (isPost && item.section === "core" ? 2 : 1),
    0
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 pb-16">
      <div className="space-y-2 pt-2">
        <Progress value={Math.round((answeredCount / totalRatings) * 100)} />
        <p className="text-xs text-muted-foreground">
          {answeredCount} of {totalRatings} answered
        </p>
      </div>

      {step === 0 ? (
        <IntroCard
          isPost={isPost}
          onStart={() => setStep(1)}
          itemCount={items.length}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardDescription>
              Step {step} of {totalSteps - 1}
            </CardDescription>
            <CardTitle className="text-lg">
              {step <= 3
                ? `Pillar ${step} — ${PILLAR_NAMES[pillars[step - 1].pillar]}`
                : "Recent activity"}
            </CardTitle>
            {step === 4 ? (
              <CardDescription>{BEHAVIORAL_PROMPT_STEM}</CardDescription>
            ) : (
              <CardDescription>
                {isPost
                  ? "Rate yourself today, and rate where you actually were in Week 1 using the standards you hold now."
                  : "There are no right answers. Rate yourself honestly — this sets your starting point."}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-8">
            {step <= 3
              ? renderCoreItems(pillars[step - 1].items)
              : renderBehavioralItems(behavioralItems)}

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              disabled={busy || step === 1}
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </Button>
            <Button onClick={advance} disabled={busy}>
              {busy
                ? "Saving..."
                : step === totalSteps - 1
                  ? isPost
                    ? "Submit & unlock certificate"
                    : "Submit & unlock Week 1"
                  : "Next"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );

  function renderCoreItems(coreItems: CapriItem[]) {
    let lastSubdimension: string | null = null;

    return coreItems.map((item) => {
      const showHeading = item.subdimension !== lastSubdimension;
      lastSubdimension = item.subdimension;

      return (
        <div key={item.id} className="space-y-3">
          {showHeading && item.subdimension ? (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {SUBDIMENSION_NAMES[item.subdimension] ?? item.subdimension}
            </p>
          ) : null}

          <p className="text-sm font-medium leading-snug">{item.prompt}</p>

          <LikertRow
            itemId={item.id}
            context="current"
            label={isPost ? "Today" : undefined}
            value={answers[key(item.id, "current")]}
            onChange={setAnswer}
          />

          {isPost ? (
            <LikertRow
              itemId={item.id}
              context="retrospective"
              label="Looking back — where you actually were in Week 1"
              value={answers[key(item.id, "retrospective")]}
              onChange={setAnswer}
            />
          ) : null}
        </div>
      );
    });
  }

  function renderBehavioralItems(list: CapriItem[]) {
    return list.map((item) => (
      <div key={item.id} className="space-y-3">
        <p className="text-sm font-medium leading-snug">{item.prompt}</p>
        <RadioGroup
          value={String(answers[key(item.id, "current")] ?? "")}
          onValueChange={(value: unknown) =>
            setAnswer(item.id, "current", Number(value))
          }
          className="flex flex-wrap gap-2"
        >
          {FREQUENCY_BANDS.map((band) => (
            <div key={band.value} className="flex items-center gap-2">
              <RadioGroupItem
                value={String(band.value)}
                id={`${item.id}-${band.value}`}
              />
              <Label
                htmlFor={`${item.id}-${band.value}`}
                className="font-normal"
              >
                {band.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    ));
  }
}

function LikertRow({
  itemId,
  context,
  label,
  value,
  onChange,
}: {
  itemId: string;
  context: RatingContext;
  label?: string;
  value: number | undefined;
  onChange: (itemId: string, context: RatingContext, value: number) => void;
}) {
  return (
    <div className="space-y-2">
      {label ? (
        <p className="text-xs text-muted-foreground">{label}</p>
      ) : null}
      <RadioGroup
        value={String(value ?? "")}
        onValueChange={(next: unknown) =>
          onChange(itemId, context, Number(next))
        }
        className="flex flex-wrap gap-x-4 gap-y-2"
      >
        {LIKERT_LABELS.map((anchor, index) => {
          const scaleValue = index + 1;
          const id = `${itemId}-${context}-${scaleValue}`;
          return (
            <div key={id} className="flex items-center gap-2">
              <RadioGroupItem value={String(scaleValue)} id={id} />
              <Label htmlFor={id} className="font-normal text-xs sm:text-sm">
                {anchor}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}

function IntroCard({
  isPost,
  onStart,
  itemCount,
}: {
  isPost: boolean;
  onStart: () => void;
  itemCount: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>
          Corporate Academy Professional Readiness Index
        </CardDescription>
        <CardTitle className="text-xl">
          {isPost ? "Week 12 assessment" : "Your readiness baseline"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          {isPost
            ? "You took this in Week 1. Taking it again shows what changed — and what you now see differently."
            : "This sets your starting point across the three pillars. It is not a test and there are no right answers."}
        </p>
        <p>
          {itemCount} questions, about {isPost ? "ten" : "seven"} minutes. Your
          answers save as you go, so you can stop and come back.
        </p>
        <p>
          Your individual answers are never shown to your institution. They see
          cohort-level results only.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={onStart}>Begin</Button>
      </CardFooter>
    </Card>
  );
}
