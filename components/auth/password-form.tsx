"use client";

import { useState } from "react";
import { Check, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  PASSWORD_RULES,
  passwordErrorMessage,
  passwordMeetsPolicy,
} from "@/lib/password-policy";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordForm({
  submitLabel,
  onSaved,
  idPrefix = "password",
}: {
  submitLabel: string;
  onSaved: () => void;
  idPrefix?: string;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const meetsPolicy = passwordMeetsPolicy(password);
  const matches = confirm.length > 0 && confirm === password;
  const canSubmit = meetsPolicy && matches && !loading;
  const requirementsId = `${idPrefix}-requirements`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { has_password: true },
    });

    if (updateError) {
      setError(passwordErrorMessage(updateError));
      setLoading(false);
      return;
    }

    setPassword("");
    setConfirm("");
    setLoading(false);
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div id={requirementsId} className="rounded-xl bg-muted/60 px-4 py-3 text-sm">
        <p className="mb-2 font-medium">Your password needs:</p>
        <ul className="space-y-1.5" aria-live="polite">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(password);
            return (
              <li
                key={rule.id}
                className={cn(
                  "flex items-center gap-2",
                  met ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {met ? (
                  <Check className="size-4 shrink-0 text-lift" aria-hidden />
                ) : (
                  <Circle className="size-4 shrink-0" aria-hidden />
                )}
                <span>
                  {rule.label}
                  <span className="sr-only">{met ? " — done" : " — not yet"}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-new`}>New password</Label>
        <Input
          id={`${idPrefix}-new`}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby={requirementsId}
          autoComplete="new-password"
          required
          className="lift-input h-11 rounded-xl text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-confirm`}>Type it again</Label>
        <Input
          id={`${idPrefix}-confirm`}
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          aria-invalid={confirm.length > 0 && !matches ? true : undefined}
          autoComplete="new-password"
          required
          className="lift-input h-11 rounded-xl text-base"
        />
        {confirm.length > 0 ? (
          <p
            aria-live="polite"
            className={cn("text-sm", matches ? "text-foreground" : "text-muted-foreground")}
          >
            {matches ? "Passwords match." : "Passwords don't match yet."}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="lift-btn w-full" disabled={!canSubmit}>
        {loading ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
