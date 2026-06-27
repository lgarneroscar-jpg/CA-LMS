# Corporate Academy Learning Center

B2B learning platform for institutional career development programs.

**Stack:** Next.js (App Router) · Supabase · Tailwind · shadcn/ui · Vercel

## Local development

1. **Prerequisites:** Node.js 20+ (includes npm)

2. **Environment:** Copy `.env.example` to `.env.local` and set your Supabase URL and anon key.

3. **Install & run:**

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

## Supabase setup

The database schema is applied via Supabase MCP / migrations in `supabase/migrations/`.

### Create your Super Admin account

1. In [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **Users** → **Add user**
2. Email: `oscarg@cordacad.com` (or your address)
3. Set a password
4. Under **User Metadata**, add:

```json
{
  "role": "super_admin",
  "full_name": "Oscar"
}
```

5. Save — the `handle_new_user` trigger creates the `profiles` row automatically.

### Create test users (optional)

**Student** — requires an institution first:

```sql
INSERT INTO institutions (name, primary_color)
VALUES ('Demo University', '#1B2A4A')
RETURNING id;
```

Then create auth user with metadata:

```json
{
  "role": "student",
  "institution_id": "<institution-uuid>",
  "full_name": "Test Student"
}
```

**Institutional admin:**

```json
{
  "role": "institutional_admin",
  "institution_id": "<institution-uuid>",
  "full_name": "Test Admin"
}
```

### Auth redirect URLs (Supabase Dashboard → Auth → URL Configuration)

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** `http://localhost:3000/auth/callback`

Add production URLs when deploying to Vercel.

## Phase 1 — Foundation

- Full database schema (Section 17) with RLS
- Email/password login
- Profile auto-creation on signup
- Role-based routing (student / institutional admin / super admin)
- Shell layout with header + sidebar navigation

## Phase 2 — Student module experience

- **Module pages** at `/program/[pillar]/[module-slug]` — video (90% tracking), workbook HTML, exercises, 5-question quiz, completion + XP
- **Weekly drip** from institution `cohort_start_date`
- **Dashboard timeline** — Last Week / This Week / Next Week with lock states
- **Seed content** — Module P1 + P2 on Demo University (cohort started 3 days ago)

### Test the student flow

1. Sign in as a **student** linked to **Demo University** (seed migration auto-links students without an institution).
2. Open `/dashboard` → click **Continue learning** or **P1** in the timeline.
3. Watch ~90% of the video → complete exercises → take the quiz → see completion animation and XP.

P1 URL: `/program/identity-brand-building/student-pre-professional-identity-shift`

## Demo preview mode

**Login:** `demo@corpacad.com` / `TestPass123!`

Create or recreate auth users via the admin API (requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`):

```bash
curl -X POST http://localhost:3000/api/create-user \
  -H "Authorization: Bearer ca-local-create-user-secret" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"demo@corpacad.com\",\"password\":\"TestPass123!\",\"recreate\":true,\"is_demo\":true,\"seed_demo_progress\":true,\"role\":\"student\",\"institution_id\":\"60b990ac-5f7e-4612-abcd-1e894aa85ad9\",\"full_name\":\"Demo Student\"}"
```

Get `SUPABASE_SERVICE_ROLE_KEY` from Supabase Dashboard → **Settings → API → service_role** (secret).

The demo account (`profiles.is_demo = true`) is linked to **Demo Preview** with:
- All modules unlocked (drip bypass)
- 280 XP, 12-day streak, rank #2
- P1 complete, P2 in progress
- Sidebar links to **Admin Dashboard** and **Roster** for buyer previews

**Super Admin cohort controls:** `/superadmin` → Cohort management
- Adjust cohort start date per institution
- Unlock specific weeks early
- Toggle fully unlocked mode (`institutions.is_fully_unlocked`)

## Project structure

See blueprint Section 18. Protected routes live under `app/(protected)/`.
