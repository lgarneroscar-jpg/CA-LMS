"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SetPasswordMode } from "@/lib/auth-links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <Card className="w-full max-w-md border-border/60 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
          CA
        </div>
        <CardTitle className="text-2xl">
          {mode === "invite" ? "Set your password" : "Choose a new password"}
        </CardTitle>
        <CardDescription>
          {mode === "invite"
            ? "Welcome to Corporate Academy. Choose a password you'll use to sign in from now on."
            : "Enter a new password for your account."}
          {email ? (
            <span className="mt-1 block font-medium text-foreground">
              {email}
            </span>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
            />
            {passwordError ? (
              <p className="text-xs text-destructive">{passwordError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
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
            />
            {confirmError ? (
              <p className="text-xs text-destructive">{confirmError}</p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Saving…"
              : mode === "invite"
                ? "Set password and continue"
                : "Save new password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
