"use client";

import { useState, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import { PasswordForm } from "@/components/auth/password-form";
import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "ca:password-prompt-dismissed";

function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function PasswordPrompt() {
  const [view, setView] = useState<"offer" | "form" | "saved" | "hidden">("offer");
  const dismissedOnThisBrowser = useSyncExternalStore(
    subscribeToStorage,
    () => window.localStorage.getItem(DISMISSED_KEY) !== null,
    () => false
  );

  async function dismiss() {
    setView("hidden");
    // localStorage keeps it hidden on this browser even if the metadata write fails.
    window.localStorage.setItem(DISMISSED_KEY, "1");
    await createClient().auth.updateUser({
      data: { password_prompt_dismissed_at: new Date().toISOString() },
    });
  }

  if (view === "hidden" || (dismissedOnThisBrowser && view === "offer")) {
    return null;
  }

  if (view === "saved") {
    return (
      <div role="status" className="lift-card flex items-start justify-between gap-4 rounded-2xl p-5">
        <p className="text-sm">
          Password saved. Next time, you can sign in with your email and
          password — email sign-in links still work too.
        </p>
        <button
          type="button"
          onClick={() => setView("hidden")}
          className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <section className="lift-card space-y-4 rounded-2xl p-6" aria-labelledby="password-prompt-title">
      <div className="space-y-1.5">
        <h2 id="password-prompt-title" className="text-lg font-semibold">
          Set a password for faster sign-in
        </h2>
        <p className="text-sm text-muted-foreground">
          You&apos;ll stay signed in on this browser either way. A password
          lets you sign in quickly on another device. It&apos;s optional — you
          can always use an email sign-in link instead.
        </p>
      </div>
      {view === "form" ? (
        <div className="max-w-md space-y-3">
          <PasswordForm
            idPrefix="prompt-password"
            submitLabel="Save password"
            onSaved={() => setView("saved")}
          />
          <button
            type="button"
            onClick={() => setView("offer")}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button type="button" className="lift-btn" onClick={() => setView("form")}>
            Set a password
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 rounded-xl px-5 text-base"
            onClick={dismiss}
          >
            Not now
          </Button>
        </div>
      )}
    </section>
  );
}
