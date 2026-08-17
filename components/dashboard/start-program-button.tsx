"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { startProgram } from "@/app/actions/program";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StartProgramButton({ className }: { className?: string }) {
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
      className={cn("lift-btn h-12 px-8 text-base font-semibold", className)}
      onClick={handleStart}
      disabled={pending}
    >
      {pending ? "Starting..." : "Go — Start the program"}
    </Button>
  );
}
