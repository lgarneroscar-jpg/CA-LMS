"use client";

import { useState } from "react";
import { PasswordForm } from "@/components/auth/password-form";
import { Button } from "@/components/ui/button";

export function PasswordSettings({ hasPassword }: { hasPassword: boolean }) {
  const [hasOne, setHasOne] = useState(hasPassword);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <section className="lift-card space-y-4 rounded-2xl p-6" aria-labelledby="password-settings-title">
      <div className="space-y-1.5">
        <h2 id="password-settings-title" className="text-lg font-semibold">
          Sign-in
        </h2>
        <p className="text-sm text-muted-foreground">
          {hasOne
            ? "You can sign in with your email and password, or with an email sign-in link."
            : "You sign in with email links. Set a password for faster sign-in on a new device — it's optional."}
        </p>
      </div>

      {saved && !open ? (
        <p role="status" className="text-sm">
          Password saved.
        </p>
      ) : null}

      {open ? (
        <div className="max-w-md space-y-3">
          <PasswordForm
            idPrefix="settings-password"
            submitLabel="Save password"
            onSaved={() => {
              setHasOne(true);
              setSaved(true);
              setOpen(false);
            }}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl px-5 text-base"
          onClick={() => {
            setSaved(false);
            setOpen(true);
          }}
        >
          {hasOne ? "Change password" : "Set a password"}
        </Button>
      )}
    </section>
  );
}
