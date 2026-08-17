"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProgramNavPillar } from "@/lib/program-nav";

type ProgramNavTreeProps = {
  pillars: ProgramNavPillar[];
};

export function ProgramNavTree({ pillars }: ProgramNavTreeProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  return (
    <div className="mt-2 space-y-3 border-t border-sidebar-border pt-3">
      {pillars.map((pillar) => {
        const isExpanded = collapsed[pillar.pillar] !== true;

        return (
          <div key={pillar.pillar} className="space-y-1">
            <button
              type="button"
              aria-expanded={isExpanded}
              onClick={() =>
                setCollapsed((prev) => ({
                  ...prev,
                  [pillar.pillar]: isExpanded,
                }))
              }
              className="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sidebar-foreground/90 transition-colors hover:bg-white/5"
            >
              <ChevronDown
                className={cn(
                  "mt-0.5 size-3.5 shrink-0 text-sidebar-foreground/50 transition-transform",
                  !isExpanded && "-rotate-90"
                )}
              />
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                  Pillar {pillar.pillar}
                </span>
                <span className="mt-0.5 block text-[13px] font-semibold leading-snug">
                  {pillar.label}
                </span>
              </span>
            </button>

            {isExpanded ? (
              <ul className="space-y-0.5 pb-1">
                {pillar.modules.map((mod) => {
                  const active = pathname === mod.href;

                  return (
                    <li key={mod.id}>
                      <Link
                        href={mod.href}
                        className={cn(
                          "flex min-w-0 items-start gap-2 rounded-lg py-2 pl-7 pr-2.5 transition-colors",
                          active
                            ? "bg-lift text-lift-foreground shadow-sm shadow-lift/20"
                            : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-sidebar-foreground"
                        )}
                      >
                        <span className="mt-0.5 shrink-0" aria-hidden>
                          {mod.status === "complete" ? (
                            <Check
                              className={cn(
                                "size-3.5",
                                active ? "text-lift-foreground" : "text-indigo-300"
                              )}
                            />
                          ) : (
                            <Circle
                              className={cn(
                                "size-3.5",
                                mod.status === "current"
                                  ? active
                                    ? "text-lift-foreground"
                                    : "text-indigo-300"
                                  : active
                                    ? "text-lift-foreground/70"
                                    : "text-sidebar-foreground/35"
                              )}
                            />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block text-[10px] font-medium uppercase tracking-wide",
                              active
                                ? "text-lift-foreground/70"
                                : "text-sidebar-foreground/50"
                            )}
                          >
                            {mod.moduleCode} · Week {mod.unlockWeek}
                          </span>
                          <span className="mt-0.5 block lift-text-wrap text-[13px] leading-snug">
                            {mod.title}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
