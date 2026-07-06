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
    <section className="lift-framework">
      <div className="border-b border-lift/15 bg-lift-muted/50 px-6 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-foreground">Completion Check</h3>
            <p className="mt-1.5 lift-body text-muted-foreground">
              Confirm you can honestly check each item before moving on.
            </p>
          </div>
          <p className="lift-chip border-0 bg-lift text-lift-foreground shadow-sm shadow-lift/20">
            {checkedCount} of {items.length}
          </p>
        </div>
      </div>
      <ul className="space-y-3 p-6 md:p-7">
        {items.map((item, index) => {
          const isChecked = Boolean(checked[index]);
          return (
            <li key={item}>
              <button
                type="button"
                onClick={() => toggle(index)}
                className={cn(
                  "lift-card-interactive flex w-full items-start gap-4 rounded-2xl px-5 py-4 text-left",
                  isChecked && "border-lift/35 bg-lift-muted/70"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-200",
                    isChecked
                      ? "scale-100 border-lift bg-lift text-lift-foreground"
                      : "scale-100 border-border bg-background"
                  )}
                >
                  {isChecked ? (
                    <Check className="size-4 animate-in zoom-in-50 duration-200" />
                  ) : null}
                </span>
                <span className="lift-body text-foreground">{item}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
