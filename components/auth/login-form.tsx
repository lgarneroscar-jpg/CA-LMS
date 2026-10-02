"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getHomePathForRole } from "@/lib/auth-routes";
import { passwordResetRedirectUrl } from "@/lib/auth-links";
import type { UserRole } from "@/types/index";
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

type View = "sign_in" | "forgot" | "reset_sent";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const urlError = searchParams.get("error");
  const linkExpired =
    urlError === "link_expired" || urlError === "auth_callback";

  function errorMessage(code: string | null) {
    switch (code) {
      case "missing_institution":
        return "Your admin account is missing an institution assignment.";
      case "no_profile":
        return "Your account exists but has no profile row. Contact support.";
      case "link_expired":
      case "auth_callback":
        return null;
      default:
        return code ? "Something went wrong. Please try again." : null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Signed in but session was not established. Please try again.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, institution_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      setError(
        profileError?.message ??
          "No profile found for this account. Check Supabase user metadata."
      );
      setLoading(false);
      return;
    }

    const home = getHomePathForRole(
      profile.role as UserRole,
      profile.institution_id
    );

    // Full navigation ensures auth cookies are sent on the next request
    window.location.assign(home);
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    // The outcome is deliberately ignored: the same confirmation is shown
    // whether or not the address is registered.
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: passwordResetRedirectUrl(window.location.origin),
    });

    setLoading(false);
    setView("reset_sent");
  }

  function openForgot() {
    setError(null);
    setPassword("");
    setView("forgot");
  }

  const displayError = error ?? errorMessage(urlError);

  return (
    <Card className="w-full max-w-md border-border/60 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
          CA
        </div>
        <CardTitle className="text-2xl">
          {view === "sign_in" ? "Sign in" : "Reset your password"}
        </CardTitle>
        <CardDescription>
          Corporate Academy Learning Center
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {linkExpired && view === "sign_in" ? (
          <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-950">
            <p className="font-medium">That link has expired or was already used.</p>
            <p>
              Invite and password links work once and only for a limited time.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Invited but never set a password?</strong> Ask your
                program administrator to resend your invite, then open the new
                email promptly.
              </li>
              <li>
                <strong>Already have an account?</strong>{" "}
                <button
                  type="button"
                  onClick={openForgot}
                  className="font-medium underline underline-offset-2"
                >
                  Email me a new password link
                </button>
                .
              </li>
            </ul>
          </div>
        ) : null}

        {view === "sign_in" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {displayError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {displayError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={openForgot}
                  className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        ) : null}

        {view === "forgot" ? (
          <form onSubmit={handleForgot} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the email you use for Corporate Academy and we&apos;ll send
              you a link to choose a new password.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
            <button
              type="button"
              onClick={() => setView("sign_in")}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Back to sign in
            </button>
          </form>
        ) : null}

        {view === "reset_sent" ? (
          <div className="space-y-4">
            <p className="rounded-md bg-muted px-3 py-3 text-sm">
              If an account exists for that email, a password reset link is on
              its way. Open it on this device, and check your spam folder if it
              doesn&apos;t arrive within a few minutes.
            </p>
            <button
              type="button"
              onClick={() => setView("sign_in")}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Back to sign in
            </button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
