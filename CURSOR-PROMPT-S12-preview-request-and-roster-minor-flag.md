# S12 — Public preview request + roster minor flag

Branch from current `main` (after `feat/preview-access` merges). Two independent tasks.

**Context you need:** public sign-up was switched OFF in Supabase on 2026-10-19 and stays off. Nobody can self-register. Task 1 deliberately creates one narrow, gated path for prospective institutional buyers to get a preview account without a human in the loop — it must not become a general open-registration hole.

---

## Task 1 — Public preview-request endpoint and form

A career services director on the marketing site submits her work email and gets a preview account automatically, within about a minute, with no action from Oscar.

### Endpoint

`POST /api/preview-request`, public, no auth.

**Input:** `email` (required), `full_name` (optional), `institution_name` (optional), `company` (honeypot — see below).

**Validation, in order:**

1. **Honeypot.** Include a hidden `company` field in the form, kept off-screen and `aria-hidden`, `tabindex="-1"`. If it is non-empty, return the standard success response and do nothing. Do not log it as an error.
2. **Well-formed email.** Reject malformed addresses with a field-level message.
3. **Free-provider gate.** Reject if the domain is a consumer mailbox provider. Minimum blocklist — keep it in one exported constant so it can be extended without hunting:
   `gmail.com, googlemail.com, yahoo.com, yahoo.co.uk, ymail.com, rocketmail.com, hotmail.com, hotmail.co.uk, outlook.com, live.com, msn.com, icloud.com, me.com, mac.com, aol.com, proton.me, protonmail.com, pm.me, gmx.com, gmx.net, mail.com, zoho.com, yandex.com, yandex.ru, qq.com, 163.com, 126.com, fastmail.com, hey.com, tutanota.com, tuta.io, duck.com`
   Message: ask for their institutional or work address, and offer the Calendly link as the alternative. **Do not restrict to `.edu`** — fraternity headquarters and nonprofit buyers are real segments and do not have `.edu` addresses.
4. **Disposable domains.** If a maintained list is cheap to add, use it. If not, skip it rather than hand-rolling one.
5. **Rate limit.** Per IP and per email domain. Something like 3 per IP per hour and 10 per domain per day — tune to taste, but both dimensions must exist, because one determined person on one campus network should not be able to mint fifty accounts.

### Behaviour

- **Address has no account:** provision into the preview institution using the existing `lib/provision-profile.ts` path — the same one `app/actions/preview-invites.ts` uses. Role `student`, preview institution, `is_demo` true. Send the invite email.
- **Address already has an account:** do nothing to that account. Do **not** re-invite, and do not move it between institutions.

### The response must not leak who has an account

**Every outcome that passes validation returns the identical success response** — new account, existing account, honeypot trip. Something like: *"Check your email — if that address is eligible, a sign-in link is on its way."*

A response that differs between "created" and "already exists" turns this endpoint into an account-enumeration oracle: anyone could test whether a given person is enrolled. Only validation failures (malformed, blocked domain, rate limited) return a distinct message, because those reveal nothing about who exists.

### Notification

Email Oscar on every accepted request, through the existing Resend path. Include the address, name and institution if supplied, and which branch it took (new account / already existed). This is his pipeline signal as much as an ops alert.

### CORS

The form is served from Squarespace at `https://www.corpacad.com`, so the request is cross-origin. Allow exactly `https://www.corpacad.com` and `https://corpacad.com` — no wildcard. Handle the preflight `OPTIONS`.

### The form itself

Build it as a small standalone widget that can be embedded in a Squarespace code block — self-contained HTML, CSS and JS, no framework, no build step. It must:

- Use a real `<form>`, a real `<label for>` and a real `<button type="submit">`
- Show inline validation messages, never an `alert()`
- Disable the button and show a pending state while in flight
- On success, replace the form with the confirmation message rather than clearing it
- Degrade to showing the Calendly link if the request fails entirely

Design reference: the approved mock is the Artifact canvas "Preview CTA — corpacad.com". Match its proportions and the navy `#1B2A4A` / gold `#C9A227` palette. Ask Oscar for the file if you cannot open it.

---

## Task 2 — Roster minor flag

Students under 18 need a parent or guardian signature for publicity release, which means their written work cannot be used in marketing on their own consent alone. That has to be known at enrolment: discovering it at Week 12, when the STAR story you wanted is the one you cannot use, is too late and cannot be fixed retroactively.

**Add `under_18_at_enrollment boolean NOT NULL DEFAULT false` to `public.profiles`,** set during provisioning from a per-student field on the roster invite form.

**Store the flag, not a date of birth.** A boolean answers the only question that matters and avoids holding a birth date for every student, which is sensitive data with no other use in this product. Do not add a `date_of_birth` column.

Surface it in the superadmin student list and include it in any consent-eligibility check built later. It does **not** need to appear in institutional reports, and should not.

Write a migration for the column in `supabase/migrations/`, following the existing naming convention.

---

## Standing rules

- **Do not run git commands.** Oscar handles all commits and pushes.
- Do not change: pillar slugs `identity-brand-building`, `executive-communication`, `career-navigation`; any enum value, DB column, route segment, seed key or email-template key.
- Run `npm run build` and report TypeScript status.
- Flag anything you had to assume rather than guessing silently.
