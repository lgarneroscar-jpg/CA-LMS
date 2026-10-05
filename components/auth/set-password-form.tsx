"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SetPasswordMode } from "@/lib/auth-links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthHeading } from "@/components/auth/auth-shell";

const MIN_PASSWORD_LENGTH = 8;

export function SetPasswordForm({
  mode,
  email,
}: {
  mode: SetPasswordMode;
  email: string | null;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tooShort = password.length < MIN_PASSWORD_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== password;
  const passwordError =
    touched.password && tooShort
      ? `Use at least ${MIN_PASSWORD_LENGTH} characters.`
      : null;
  const confirmError =
    touched.confirm && (mismatch || confirm.length === 0)
      ? "Passwords do not match."
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ password: true, confirm: true });
    if (tooShort || confirm !== password) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setPassword("");
    setConfirm("");
    // "/" lets the proxy route by role: new students continue to onboarding
    // and the CAPRI baseline; returning users land on their normal home.
    window.location.assign("/");
  }

  return (
    <div>
      <AuthHeading
        title={mode === "invite" ? "Set your password" : "Choose a password"}
        description={
          <>
            {mode === "invite"
              ? "Welcome. Choose a password you'll use to sign in from now on."
              : "You're signed in. Choose a password you'll use to sign in from now on."}
            {email ? (
              <span className="mt-1 block font-medium text-foreground">
                {email}
              </span>
            ) : null}
          </>
        }
      />
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            aria-invalid={passwordError ? true : undefined}
            autoComplete="new-password"
            required
            className="lift-input h-11 rounded-xl text-base"
          />
          {passwordError ? (
            <p className="text-sm text-destructive">{passwordError}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              At least {MIN_PASSWORD_LENGTH} characters.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
            aria-invalid={confirmError ? true : undefined}
            autoComplete="new-password"
            required
            className="lift-input h-11 rounded-xl text-base"
          />
          {confirmError ? (
            <p className="text-sm text-destructive">{confirmError}</p>
          ) : null}
        </div>
        <Button type="submit" className="lift-btn w-full" disabled={loading}>
          {loading
            ? "Saving…"
            : mode === "invite"
              ? "Set password and continue"
              : "Save password and continue"}
        </Button>
      </form>
    </div>
  );
}
