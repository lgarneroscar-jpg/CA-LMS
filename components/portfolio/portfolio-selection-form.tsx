"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePortfolioSelection } from "@/app/actions/portfolio";
import { Button } from "@/components/ui/button";

export type PortfolioSelectionItem = {
  key: string;
  title: string;
  preview: string;
};

export type PortfolioSelectionGroup = {
  pillar: number;
  pillarLabel: string;
  modules: { moduleId: string; moduleTitle: string; items: PortfolioSelectionItem[] }[];
};

type Props = {
  groups: PortfolioSelectionGroup[];
  initialSelection: string[];
};

function sameSelection(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  for (const key of a) if (!b.has(key)) return false;
  return true;
}

export function PortfolioSelectionForm({ groups, initialSelection }: Props) {
  const router = useRouter();
  const statusId = useId();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState(() => new Set(initialSelection));
  const [savedSelection, setSavedSelection] = useState(() => new Set(initialSelection));
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null
  );

  const total = useMemo(
    () => groups.reduce((n, g) => n + g.modules.reduce((m, mod) => m + mod.items.length, 0), 0),
    [groups]
  );
  const dirty = !sameSelection(selected, savedSelection);

  function toggle(key: string, checked: boolean) {
    setMessage(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function save(openAfter: boolean) {
    startTransition(async () => {
      const result = await savePortfolioSelection([...selected]);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      const persisted = new Set(result.selection);
      setSelected(persisted);
      setSavedSelection(persisted);
      if (openAfter) {
        router.push("/portfolio");
      } else {
        setMessage({ tone: "ok", text: "Selection saved." });
      }
    });
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <fieldset key={group.pillar} className="lift-card space-y-5 rounded-2xl p-5 md:p-6">
          <legend className="sr-only">{group.pillarLabel}</legend>
          <div aria-hidden className="border-b border-lift/15 pb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-lift">
              Pillar {group.pillar}
            </p>
            <p className="mt-1 text-lg font-semibold">{group.pillarLabel}</p>
          </div>
          {group.modules.map((module) => (
            <div key={module.moduleId} className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">{module.moduleTitle}</p>
              <ul className="space-y-2">
                {module.items.map((item) => {
                  const checked = selected.has(item.key);
                  return (
                    <li key={item.key}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 p-3 transition-colors hover:bg-muted/40 has-[:checked]:border-lift/50 has-[:checked]:bg-lift-muted/60">
                        <input
                          type="checkbox"
                          className="mt-1 size-4 shrink-0 accent-[var(--lift)]"
                          checked={checked}
                          onChange={(event) => toggle(item.key, event.target.checked)}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{item.title}</span>
                          {item.preview ? (
                            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground line-clamp-2">
                              {item.preview}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </fieldset>
      ))}

      <div
        data-print-hide
        className="sticky bottom-20 z-10 flex flex-col gap-3 rounded-2xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between md:bottom-4"
      >
        <p id={statusId} aria-live="polite" className="text-sm">
          {message ? (
            <span className={message.tone === "error" ? "text-destructive" : "text-foreground"}>
              {message.text}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {selected.size} of {total} selected
              {dirty ? " · unsaved changes" : ""}
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending || !dirty}
            onClick={() => save(false)}
            aria-describedby={statusId}
          >
            Save selection
          </Button>
          <Button
            type="button"
            disabled={pending || selected.size === 0}
            onClick={() => save(true)}
            aria-describedby={statusId}
          >
            {pending ? "Saving…" : "Generate portfolio"}
          </Button>
        </div>
      </div>
    </div>
  );
}
