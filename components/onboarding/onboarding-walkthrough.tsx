"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/app/actions/onboarding";
import { ONBOARDING_STEPS } from "@/lib/onboarding-content";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function OnboardingWalkthrough() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const current = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  async function finish() {
    setLoading(true);
    await completeOnboarding();
    router.push("/diagnostic");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardDescription>
            Step {step + 1} of {ONBOARDING_STEPS.length}
          </CardDescription>
          <CardTitle>{current.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {current.body}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between gap-2">
          <Button
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
          {isLast ? (
            <Button onClick={finish} disabled={loading}>
              {loading ? "Saving..." : "Start diagnostic"}
            </Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
