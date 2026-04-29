# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Folio Cafe** — a talent-discovery platform where talent create role profiles and employers send interview requests. Built with Next.js 14 (App Router), Supabase (auth + storage + Postgres), and Prisma 7 as the ORM.

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # ESLint
npm run vercel-build # migrate → prisma generate → next build (used in CI/CD)
```

No test suite is configured.

## Environment Variables

Copy `.env.example` and fill in values. Required at runtime:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `DATABASE_URL` | Supabase pooler connection (port 6543, used by Prisma at runtime) |
| `DIRECT_URL` | Direct Postgres connection (port 5432, used by Prisma migrations) |
| `OPENAI_API_KEY` | Used by the CV parser (`/api/cv/parse`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_JWT_SECRET` | Admin login credentials |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key for admin API routes |
| `SUPABASE_PROJECT_REF` / `SUPABASE_ACCESS_TOKEN` | Used by the deploy migration script |

## Architecture

### Dual-database pattern

The app uses **two database clients side-by-side**:

- **Supabase JS client** (`src/lib/supabase/`) — used for auth, Realtime, Storage, and RLS-protected reads/writes on the Supabase schema. Three variants: `client.ts` (browser), `server.ts` (Server Components / Route Handlers), `admin.ts` (service-role, bypasses RLS).
- **Prisma** (`src/lib/prisma.ts`) — used for structured ORM queries. Prisma 7 requires a driver adapter (`PrismaPg`); `DATABASE_URL` must point to the Supabase pooler (port 6543). Generated client lives in `src/generated/prisma/`.

Admin API routes use `createAdminClient()` (service-role key). User-facing API routes use the server Supabase client (respects RLS).

### Middleware (two files)

There are **two separate middleware files**:

- `middleware.ts` (root) — handles Supabase session refresh for all non-static routes; redirects unauthenticated users away from `/dashboard` and `/requests`.
- `src/middleware.ts` — protects `/admin/*` routes by verifying an HMAC-SHA256 signed token stored in the `admin_session` cookie.

Next.js only loads one middleware file. The root `middleware.ts` is the active one at runtime; `src/middleware.ts` is the admin guard that should be merged or activated correctly if the admin section is in scope.

### Auth system (two independent layers)

1. **User auth** — Supabase Auth (magic link / email+password). `AuthContext` (`src/contexts/AuthContext.tsx`) provides `userProfile`, `loadingAuth`, `signOut`, and `refreshProfile` to all Client Components. The `user_profiles` table extends `auth.users` 1-to-1; a Supabase trigger populates it on signup (with a fallback recovery path in `AuthContext` if the trigger missed).

2. **Admin auth** — entirely separate, credential-based (no Supabase auth). Credentials live in env vars. Login hits `/api/admin/login`, which issues a signed HMAC-SHA256 token in an httpOnly cookie (8 h TTL). All `/admin/*` pages are gated by the middleware.

### Database schema (key tables)

- `user_profiles` — one row per `auth.users` entry; stores `user_role` (`talent` | `employer`), `is_verified`, `verified_at`.
- `profiles` — talent role profiles (many per user); holds skills, availability, salary expectation, CV/portfolio links, view counters.
- `interview_requests` — employer → talent pipeline; unique on `(employer_id, profile_id)`; `stage` progresses through `discovered → interested → interview → offer → hired`.
- `test_attempts` — proficiency test results; score calculated server-side via a Postgres `SECURITY DEFINER` function (`submit_test_attempt()`); correct answers are never sent to the client.
- `portfolio_items`, `user_cvs` — storage-backed files in Supabase Storage buckets.

### Migration strategy

Migrations are **not** run via the Prisma CLI directly in production. Instead, `scripts/migrate.mjs` runs on every Vercel deploy (as part of `vercel-build`). It applies both `supabase/migrations/*.sql` and `prisma/migrations/*/migration.sql` via the Supabase Management API, tracking applied migrations in a `public._migrations` table. The `0_init` Prisma migration dir is intentionally skipped.

### CV parsing (`/api/cv/parse`)

Accepts PDF or DOCX uploads. Extracts text via `pdfjs-dist` (Node worker-thread shim) or `mammoth`, then sends text to GPT-4o-mini (OpenAI) to return structured `CVData`. Both libraries are listed in `serverComponentsExternalPackages` to prevent bundling — they require Node.js native APIs.

### Route structure

```
/                        landing page
/auth/login|signup|...   Supabase auth flows
/dashboard/talent/...    talent dashboard (profile, tests, CVs, portfolio, verify)
/dashboard/employer/     employer dashboard
/search                  public talent search
/profile/[id]            public talent profile
/requests                employer pipeline view
/settings                user settings
/admin/...               admin panel (separate auth)
```

### Styling

Tailwind CSS with utility classes. Custom component classes (`btn-primary`, `btn-secondary`, `card`) defined in `src/app/globals.css`. No component library.
