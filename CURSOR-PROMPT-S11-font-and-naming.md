# Cursor prompt — S11: font fix, one programme name, honest link copy

Copy everything below the line into Cursor. **One small commit, no migration.** All four items came out of the S10 review.

---

## 1. The broken font — one line, affects every page

`app/globals.css` line 10:

```css
--font-sans: var(--font-sans);        /* refers to itself, never resolves */
--font-mono: var(--font-geist-mono);  /* correct, for comparison */
--font-heading: var(--font-sans);     /* inherits the break */
```

`app/layout.tsx` loads Geist and exposes it as `--font-geist-sans`. The variable is never pointed at it, so **all body text across the entire app has been falling back to a default serif** since the beginning. The serif headings are intentional; the serif body text is not.

Point it at the real variable, check `--font-heading` resolves correctly as a result, and **look at a module page, the dashboard and the login page afterwards** — this changes the typography of the whole product, so confirm nothing that was tuned around the fallback now breaks (line lengths, card heights, the workbook blocks).

## 2. One programme name

Two names are in use:

- auth pages: "Corporate Academy Career Readiness Program"
- `PORTFOLIO_PROGRAM_NAME` in `lib/portfolio.ts`: "Pre-Professional Readiness Program"

**The canonical name is "Corporate Academy Career Readiness Program".** Make it a single shared constant and use it everywhere the programme is named — auth pages, portfolio document, certificate, and anywhere else. The portfolio is the document that reaches a recruiter, so it must not carry a different name from the site the student signed in to.

## 3. Don't state a link lifetime we cannot verify

The expired-link copy says links last 24 hours. The real value is the project's Email OTP Expiration setting, which is not readable from code and may not match.

Either read it from configuration, or **drop the specific number** — "links expire after a short time, request a new one" is accurate regardless and cannot go stale. Prefer the version that cannot become wrong.

## 4. Check whether the same-browser limitation still applies

You noted that a link requested on a laptop and opened on a phone shows "expired", because of how Supabase sign-in links work by default.

**That may already be solved.** The Supabase email templates were changed to the token-hash form:

```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery
```

A `token_hash` link carries no PKCE verifier, so it should not be browser-bound — unlike the default implicit-flow link. The callback already handles `token_hash`.

**Verify which form the live emails actually use**, then make the on-page copy match reality. If the limitation is gone, remove the warning — telling students a true-sounding thing that is false costs trust and generates support mail. If it still applies, keep it.

## Acceptance criteria

- `npm run build` passes; tests still pass.
- Geist renders as body text across the app; serif remains only where intended.
- One programme name everywhere, from a single constant.
- No stated link lifetime that cannot be verified from code or configuration.
- Same-browser copy matches actual behaviour, confirmed rather than assumed.
- No changes to auth logic, grading, reporting or data.

List every file you change, and say what you found on item 4.

---

## After Cursor — REQUIRED

1. `npm run build`
2. Commit and push on `main`.
3. Worth a quick look at a module page before and after the font change — it is the biggest visual change the product has had in one line.
