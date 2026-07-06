"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CompletionCheckV2Props = {
  items: string[];
};

export function CompletionCheckV2({ items }: CompletionCheckV2Props) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const checkedCount = Object.values(checked).filter(Boolean).length;

  function toggle(index: number) {
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Completion Check</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirm you can honestly check each item before moving on.
          </p>
        </div>
        <p className="text-sm font-medium text-lift">
          {checkedCount} of {items.length}
        </p>
      </div>
      <ul className="mt-5 space-y-2">
        {items.map((item, index) => {
          const isChecked = Boolean(checked[index]);
          return (
            <li key={item}>
              <button
                type="button"
                onClick={() => toggle(index)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lift/40 focus-visible:ring-offset-2",
                  isChecked
                    ? "border-lift/30 bg-lift-muted/60"
                    : "border-border bg-background hover:bg-muted/40"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-all",
                    isChecked
                      ? "scale-100 border-lift bg-lift text-lift-foreground"
                      : "scale-100 border-border bg-background"
                  )}
                >
                  {isChecked ? (
                    <Check className="size-3.5 animate-in zoom-in-50 duration-200" />
                  ) : null}
                </span>
                <span className="text-sm leading-relaxed text-foreground">{item}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
