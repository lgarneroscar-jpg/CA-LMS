"use client";

import { motion } from "framer-motion";
import { Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { XP_REWARDS } from "@/lib/xp";

type CompletionCelebrationProps = {
  xpEarned: number;
  quizScore: number;
  quizTotal: number;
  nextModuleHref?: string | null;
};

export function CompletionCelebration({
  xpEarned,
  quizScore,
  quizTotal,
  nextModuleHref,
}: CompletionCelebrationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-primary via-primary to-primary/90 p-8 text-primary-foreground shadow-xl"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-accent/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 size-24 rounded-full bg-accent/10 blur-xl" />

      <div className="relative flex flex-col items-center text-center">
        <motion.div
          initial={{ rotate: -10, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex size-20 items-center justify-center rounded-full bg-accent text-accent-foreground"
        >
          <Trophy className="size-10" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-6 text-2xl font-bold"
        >
          Module complete!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-2 flex items-center gap-2 text-primary-foreground/90"
        >
          <Sparkles className="size-4 text-accent" />
          +{xpEarned} XP earned
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-1 text-sm text-primary-foreground/70"
        >
          Quiz: {quizScore}/{quizTotal}
          {quizScore === quizTotal && ` · Perfect score (+${XP_REWARDS.perfectQuiz} XP)`}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            Back to dashboard
          </Link>
          {nextModuleHref && (
            <Link
              href={nextModuleHref}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-primary-foreground/30 px-5 text-sm font-medium hover:bg-primary-foreground/10"
            >
              Next module
            </Link>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
