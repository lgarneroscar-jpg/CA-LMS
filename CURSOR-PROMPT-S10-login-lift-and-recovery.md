# Cursor prompt — S10: lift the auth pages and add real recovery paths

Copy everything below the line into Cursor. **One commit, no migration.**

---

## 0. Why

`learn.corpacad.com/login` is now linked from the public marketing site at corpacad.com, so it is the **first screen a student sees** after leaving a polished, branded page. Today it is an unstyled card on a grey field — no `experience-lift`, no `lift-card`, no Campus Indigo. The jump from the marketing site to this is jarring and reads as a different, lesser product.

It is also a **dead end for the two situations most likely to occur** in week one of a cohort.

## 1. Lift the auth pages

Apply the existing Campus Indigo language — the same tokens used across the student experience (`experience-lift`, `lift-card`, `lift-btn`, `lift-body`). Do not invent a new visual style and do not import anything new.

Covers `/login`, `/auth/set-password`, and `/auth/confirm`.

- Centred card, generous spacing, serif heading consistent with the module pages.
- Say where they are: **Corporate Academy Career Readiness Program**. A student arriving from corpacad.com should recognise it immediately.
- One indigo accent for the primary action. Gold stays reserved for achievement and must not appear here.
- Must work at mobile width — students will open invite links on a phone.

Keep it calm and sparse. This is a door, not a landing page: no marketing copy, no feature list, no imagery that slows the load.

## 2. Make recovery self-service — Oscar should only be needed for the first invite

**Design goal: after the initial invite is sent, a student must be able to get back in without contacting anyone.** Today every failure routes to a human, which does not survive a cohort of 25 hitting a deadline at 2am.

**The key realisation:** a student who never accepted their invite and a student who forgot their password need *the same thing* — an email with a link that lands them on `/auth/set-password`. Supabase's `resetPasswordForEmail` produces exactly that for any existing auth user, and every invited student is already an auth user. So **one flow covers both cases.**

Replace the three-case help text with **one self-service action**, prominent rather than buried:

> **Can't sign in? Email me a sign-in link** → enter your email → confirmation.

- Use the existing `resetPasswordForEmail` with `redirectTo: <origin>/auth/callback?next=/auth/set-password`.
- Keep the identical confirmation whether or not the account exists. That is deliberate and must not change — it stops anyone probing which students are enrolled.
- Label it so a student who never got an invite understands it applies to them. Something like *"Works whether you've set a password before or not — including if your invite expired."*
- **Verify this actually works for an invited-but-never-accepted user.** That user exists in `auth.users` but may be unconfirmed, and Supabase's behaviour for recovery on an unconfirmed user needs checking rather than assuming. If recovery does not reach them, use `signInWithOtp` with `shouldCreateUser: false` instead, which sends a magic link and will not create accounts for strangers. **Report which one you used and how you verified it.**

Then a short disclosed section for what genuinely cannot be self-served:

**"Nothing arrived"** — the address may not be the one the institution enrolled, links expire after 24 hours, and check spam. Then the contact route.

**"I don't know which email I'm enrolled with"** — this one genuinely needs a human, because answering it would reveal who is enrolled. Contact route.

Add one line near the sign-in button: **"Accounts are created by your programme administrator — there's no public sign-up."** That prevents most confused attempts before they become emails.

**Fix the email field while you are there.** The placeholder currently reads `you@university.edu`, which asserts a domain that may not be true — institutions can enrol a student with a personal address, and that student will then doubt they are in the right place. Use a neutral placeholder (`you@example.com`) and put the useful information in helper text under the field: **"Use the address your program used to enrol you."** A placeholder cannot answer *which* email; the helper line can. Apply the same change to the email field in the sign-in-link flow.

## 3. The contact route

Use a single shared `mailto:` constant — one place to change it, not scattered across components.

**Address: `academy@corpacad.com`.**

Pre-fill a subject line such as "Corporate Academy — login help" so the inbox is sortable from day one.

## 4. Error states should explain, not just report

The expired-link case already exists. Check the copy reads as an explanation and a next step rather than an error code — a student seeing "link_expired" in a URL should still be told, in plain words, that invite links last 24 hours and how to get another.

## Acceptance criteria

- `npm run build` passes.
- `/login`, `/auth/set-password` and `/auth/confirm` use the existing Campus Indigo tokens and are legible on a phone.
- The page names the programme.
- **A student who never accepted their invite can recover entirely on their own**, without contacting anyone — verified against a real invited-but-never-signed-in account, not assumed.
- A student who forgot their password uses the same single flow.
- The confirmation reveals nothing about whether an account exists, and tells the student what to do if nothing arrives.
- The "no public sign-up" line is present.
- One shared contact constant set to `academy@corpacad.com`.
- No changes to auth logic, session handling, redirect behaviour, or anything outside these pages.

List every file you change and the contact address you used.

---

## After Cursor — REQUIRED

1. `npm run build`
2. Commit and push on `main`; say which branch if not.
3. No migration expected.
