"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProgramNavPillar } from "@/lib/program-nav";

type ProgramNavTreeProps = {
  pillars: ProgramNavPillar[];
};

export function ProgramNavTree({ pillars }: ProgramNavTreeProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  return (
    <div className="mt-3 space-y-1 border-t border-sidebar-border pt-3">
      {pillars.map((pillar) => {
        const isExpanded = collapsed[pillar.pillar] !== true;

        return (
          <div key={pillar.pillar}>
            <button
              type="button"
              aria-expanded={isExpanded}
              onClick={() =>
                setCollapsed((prev) => ({
                  ...prev,
                  [pillar.pillar]: isExpanded,
                }))
              }
              className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
            >
              <ChevronDown
                className={cn(
                  "mt-0.5 size-4 shrink-0 transition-transform",
                  !isExpanded && "-rotate-90"
                )}
              />
              <span className="leading-snug">
                Pillar {pillar.pillar} — {pillar.label}
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
                          "block rounded-lg py-1.5 pl-9 pr-3 transition-colors",
                          active
                            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        <span className="text-xs text-sidebar-foreground/60">
                          {mod.moduleCode} · Wk {mod.unlockWeek}
                        </span>
                        <span className="block text-[13px] leading-snug">
                          {mod.title}
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
