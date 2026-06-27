"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitDiagnostic } from "@/app/actions/onboarding";
import { DIAGNOSTIC_QUESTIONS } from "@/lib/onboarding-content";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function DiagnosticForm() {
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const question = DIAGNOSTIC_QUESTIONS[step];
  const isLast = step === DIAGNOSTIC_QUESTIONS.length - 1;

  async function handleNext() {
    const value = responses[question.key]?.trim();
    if (!value) {
      setError("Please answer before continuing.");
      return;
    }
    setError(null);
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }

    setLoading(true);
    try {
      await submitDiagnostic(responses);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardDescription>
            Question {step + 1} of {DIAGNOSTIC_QUESTIONS.length}
          </CardDescription>
          <CardTitle className="text-lg">{question.label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {question.type === "choice" ? (
            <RadioGroup
              value={responses[question.key] ?? ""}
              onValueChange={(value) =>
                setResponses((prev) => ({ ...prev, [question.key]: value }))
              }
            >
              {question.options?.map((option) => (
                <div key={option} className="flex items-start gap-2">
                  <RadioGroupItem value={option} id={option} className="mt-1" />
                  <Label htmlFor={option} className="font-normal leading-snug">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <Textarea
              placeholder={question.placeholder}
              value={responses[question.key] ?? ""}
              onChange={(e) =>
                setResponses((prev) => ({
                  ...prev,
                  [question.key]: e.target.value,
                }))
              }
              rows={4}
            />
          )}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
          <Button onClick={handleNext} disabled={loading}>
            {loading ? "Submitting..." : isLast ? "Finish & unlock Week 1" : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
