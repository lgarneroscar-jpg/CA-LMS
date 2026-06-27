"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { startProgram } from "@/app/actions/program";
import { Button } from "@/components/ui/button";

export function StartProgramButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleStart() {
    startTransition(async () => {
      await startProgram();
      router.refresh();
    });
  }

  return (
    <Button
      size="lg"
      className="h-12 px-8 text-base font-semibold"
      onClick={handleStart}
      disabled={pending}
    >
      {pending ? "Starting..." : "Go — Start the program"}
    </Button>
  );
}
