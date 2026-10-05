# Cursor prompt — S3.1: invite acceptance, password set, and password reset

Copy everything below the line into Cursor. **One commit. This closes a first-cohort blocker.**

---

## 0. What is missing

The invite flow sends an email, but there is nowhere for the student to land. Verified across the codebase:

- `app/auth/callback/route.ts` is the **only** auth route. It exchanges a code for a session and redirects to the role home.
- **`supabase.auth.updateUser` is never called anywhere.** No page lets any user set or change a password.
- `components/auth/login-form.tsx` only calls `signInWithPassword`. There is no magic-link option and no password reset.

Consequences today:
1. An invited student clicks the link, gets a session, lands on the dashboard — and **can never log in again**, because they have no password.
2. **Any student who forgets a password is permanently locked out.** There is no recovery path.
3. A link clicked after expiry drops the student on `/login` with no explanation. Confirmed in the Supabase auth log: `GET /verify → "email link has expired" → 303`.

This blocks the first cohort. Fixing it is this pass.

## 1. Set-password page

Create `app/auth/set-password/page.tsx`.

- Requires an active session (the invite or recovery link supplies one). No session → redirect to `/login` with a message saying the link has expired and to request a new one.
- Form: new password, confirm password. Minimum 8 characters, matching, with inline errors.
- Submit calls `supabase.auth.updateUser({ password })`.
- **Never pre-fill, generate, display, or email a password.** The student types it; nothing else ever sees it.
- On success, send them onward (see §3).

Use one page for both invite acceptance and password reset — the flows are identical once a session exists. Vary only the heading: *"Set your password"* for a new account, *"Choose a new password"* for a reset.

## 2. Route invited users to it

`app/auth/callback/route.ts` currently sends everyone to their role home. An invited user with no password must go to `/auth/set-password` first.

- Read the `type` parameter Supabase sends (`invite`, `recovery`, `signup`, `magiclink`) and forward `invite` and `recovery` to `/auth/set-password`.
- Also handle the token-hash form: newer Supabase links arrive as `token_hash` + `type` rather than `code`. **Support both** — `exchangeCodeForSession` for `code`, `verifyOtp` for `token_hash`. Today only `code` is handled, which may itself be why the link did not work.
- Preserve the existing `next` parameter behaviour.
- On an expired or invalid link, redirect to `/login?error=link_expired` and have the login page render a plain explanation plus a way to request a new link — not a bare error code.

## 3. Where a student goes after setting a password

First-time invite acceptance should flow into the existing start-of-program path rather than dumping them on a dashboard: **set password → onboarding → CAPRI Week 1 baseline → program**. Reuse the current redirect logic; do not build a parallel one.

A password reset returns the user to their normal role home.

## 4. Password reset from the login page

Add "Forgot your password?" to `components/auth/login-form.tsx`.

- Collect the email, call `supabase.auth.resetPasswordForEmail(email, { redirectTo: <origin>/auth/callback?next=/auth/set-password })`.
- **Always show the same confirmation** whether or not the address exists — never reveal which emails are registered.
- This shares the set-password page from §1.

## 5. Supabase configuration Oscar must set

Flag these in your summary; they are dashboard settings, not code:

- **Authentication → URL Configuration → Site URL**: `https://ca-lms.vercel.app`
- **Redirect URLs** must include `https://ca-lms.vercel.app/auth/callback` (and the localhost equivalent for development). A redirect target not on this list is rejected and the user lands on the login page with no explanation.
- **Email templates → Invite user**: confirm the link points at the callback, carrying `type=invite`.
- Note the invite link lifetime, and whether it can be extended for a cohort rollout where students may not open email the same day.

## 6. Resend must actually help

S3 already has a resend action. Make sure it issues a **fresh** invite link, and that the roster shows when the last invite was sent, so "resend" is a real remedy for an expired link rather than a button that appears to do nothing.

## Acceptance criteria

- `npm run build` passes.
- A new invited user can click the email link, set a password, and reach onboarding.
- That same user can sign out and sign back in with the password they chose.
- "Forgot your password?" sends a working reset that lands on the same page.
- The callback handles **both** `code` and `token_hash` link formats.
- An expired link produces a clear message and a route to a new one, never a silent bounce to `/login`.
- No code path sets, displays, emails, or logs a password.
- No changes to learning content, scoring, reporting, or the CAPRI instrument.

List every file you change, confirm no password is ever handled outside the user's own form submission, and state which Supabase dashboard settings Oscar still needs to set.

---

## After Cursor — REQUIRED

1. `npm run build`
2. Commit and push on `main` — or tell me the branch, since two sessions are working this repo.
3. Set the Supabase URL configuration from §5 **before** retesting.
4. Send a fresh invite and click it promptly; the old emails are expired and will keep failing regardless of this fix.
