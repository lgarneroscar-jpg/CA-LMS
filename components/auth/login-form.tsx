"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getHomePathForRole } from "@/lib/auth-routes";
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

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const urlError = searchParams.get("error");

  function errorMessage(code: string | null) {
    switch (code) {
      case "missing_institution":
        return "Your admin account is missing an institution assignment.";
      case "no_profile":
        return "Your account exists but has no profile row. Contact support.";
      case "auth_callback":
        return "Sign-in link expired or was invalid. Please try again.";
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

  const displayError = error ?? errorMessage(urlError);

  return (
    <Card className="w-full max-w-md border-border/60 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
          CA
        </div>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>
          Corporate Academy Learning Center
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            <Label htmlFor="password">Password</Label>
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
      </CardContent>
    </Card>
  );
}
