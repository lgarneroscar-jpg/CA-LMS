"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

type ProgramCompletionCelebrationProps = {
  studentName: string;
  certificateUrl: string;
  linkedInCaption: string;
};

export function ProgramCompletionCelebration({
  studentName,
  certificateUrl,
  linkedInCaption,
}: ProgramCompletionCelebrationProps) {
  async function copyCaption() {
    await navigator.clipboard.writeText(linkedInCaption);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4"
    >
      <div className="max-w-lg space-y-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
        >
          <Trophy className="mx-auto size-20 text-accent" />
        </motion.div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">You did it, {studentName}!</h1>
          <p className="text-muted-foreground">
            All 14 modules and 4 live sessions complete. You&apos;re Corporate
            Academy Certified.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href={certificateUrl}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            View certificate
          </Link>
          <button
            type="button"
            onClick={copyCaption}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            Copy LinkedIn caption
          </button>
        </div>
      </div>
    </motion.div>
  );
}
