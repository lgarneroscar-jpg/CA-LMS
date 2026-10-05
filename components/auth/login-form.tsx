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
import { AuthHeading, SupportLink } from "@/components/auth/auth-shell";

type View = "sign_in" | "forgot" | "reset_sent";

function signInErrorMessage(message: string) {
  if (message === "Invalid login credentials") {
    return "That email and password don't match. Check for typos, or use “Email me a sign-in link” below — it works even if you've never set a password.";
  }
  return message;
}

function NothingArrivedList() {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      <li>
        Make sure it&apos;s the address your programme enrolled you with —
        often your university email, not a personal one.
      </li>
      <li>Links expire after a short time. If yours is old, request a new one.</li>
      <li>Check your spam or junk folder.</li>
      <li>
        Still nothing? Email <SupportLink />{" "}and we&apos;ll help.
      </li>
    </ul>
  );
}

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
        return "Your administrator account isn't linked to an institution yet. Email us and we'll sort it out.";
      case "no_profile":
        return "You signed in, but your account isn't fully set up yet. Email us and we'll sort it out.";
      case "link_expired":
      case "auth_callback":
        return null;
      default:
        return code ? "Something went wrong signing you in. Please try again." : null;
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
      setError(signInErrorMessage(signInError.message));
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You were signed in, but the session didn't stick. Please try again.");
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
        "You signed in, but your account isn't fully set up yet. Email us and we'll sort it out."
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

  function backToSignIn() {
    setError(null);
    setView("sign_in");
  }

  const displayError = error ?? errorMessage(urlError);
  const showSupport =
    !error && (urlError === "missing_institution" || urlError === "no_profile");

  if (view === "forgot") {
    return (
      <form onSubmit={handleForgot} className="space-y-5">
        <AuthHeading
          title="Email me a sign-in link"
          description="Works whether you've set a password before or not — including if your invite expired."
        />
        <p className="text-sm text-muted-foreground">
          The link signs you in and lets you choose a password for next time.
        </p>
        <div className="space-y-2">
          <Label htmlFor="reset-email">Your enrolled email</Label>
          <Input
            id="reset-email"
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="lift-input h-11 rounded-xl text-base"
          />
        </div>
        <Button type="submit" className="lift-btn w-full" disabled={loading}>
          {loading ? "Sending…" : "Email me a link"}
        </Button>
        <button
          type="button"
          onClick={backToSignIn}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Back to sign in
        </button>
      </form>
    );
  }

  if (view === "reset_sent") {
    return (
      <div className="space-y-5">
        <AuthHeading
          title="Check your email"
          description="If that address is enrolled in the programme, a sign-in link is on its way."
        />
        <p className="text-sm">
          The link works once and lets you choose a password. Use the newest
          email if you&apos;ve asked more than once.
        </p>
        <div className="space-y-2 rounded-xl bg-muted/60 px-4 py-3 text-sm">
          <p className="font-medium">Nothing arrived after a few minutes?</p>
          <NothingArrivedList />
        </div>
        <div className="flex flex-col gap-2 text-center text-sm">
          <button
            type="button"
            onClick={openForgot}
            className="text-muted-foreground hover:text-foreground"
          >
            Try a different email
          </button>
          <button
            type="button"
            onClick={backToSignIn}
            className="text-muted-foreground hover:text-foreground"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AuthHeading title="Sign in" />

      {linkExpired ? (
        <div className="space-y-2 rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm">
          <p className="font-medium">That link has expired or was already used.</p>
          <p>
            Invite and sign-in links work once, and only for a short time. You
            can get a fresh one yourself — use{" "}
            <button
              type="button"
              onClick={openForgot}
              className="font-medium underline underline-offset-2"
            >
              Email me a sign-in link
            </button>
            . If a new link also fails, open it on the same device you
            requested it from.
          </p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        {displayError && (
          <p
            role="alert"
            className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {displayError}
            {showSupport ? (
              <>
                {" "}
                <SupportLink />
              </>
            ) : null}
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
            className="lift-input h-11 rounded-xl text-base"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={openForgot}
              className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="lift-input h-11 rounded-xl text-base"
          />
        </div>
        <Button type="submit" className="lift-btn w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Accounts are created by your programme administrator — there&apos;s
          no public sign-up.
        </p>
      </form>

      <div className="border-t border-border pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={openForgot}
          className="h-11 w-full rounded-xl text-base font-medium"
        >
          Can&apos;t sign in? Email me a sign-in link
        </Button>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Works whether you&apos;ve set a password before or not — including if
          your invite expired.
        </p>
      </div>

      <details className="group rounded-xl border border-border px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium marker:text-muted-foreground">
          More help signing in
        </summary>
        <div className="mt-3 space-y-4">
          <div className="space-y-1.5">
            <p className="font-medium">Nothing arrived</p>
            <NothingArrivedList />
          </div>
          <div className="space-y-1.5">
            <p className="font-medium">I don&apos;t know which email I&apos;m enrolled with</p>
            <p>
              Email <SupportLink />{" "}with your name and institution, and
              we&apos;ll tell you which address to use.
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}
