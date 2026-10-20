"use client";

import Link from "next/link";
import { AuthHeading } from "@/components/auth/auth-shell";
import { PasswordForm } from "@/components/auth/password-form";

export function SetPasswordForm({ email }: { email: string | null }) {
  return (
    <div className="space-y-5">
      <AuthHeading
        title="You're signed in"
        description={
          <>
            Choose a new password for faster sign-in next time, or skip this
            and carry on — you&apos;ll stay signed in on this browser.
            {email ? (
              <span className="mt-1 block font-medium text-foreground">
                {email}
              </span>
            ) : null}
          </>
        }
      />
      <PasswordForm
        submitLabel="Save password and continue"
        onSaved={() => window.location.assign("/")}
      />
      <Link
        href="/"
        className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
      >
        Skip for now
      </Link>
    </div>
  );
}
