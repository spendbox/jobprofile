# TalentDeck Admin System

## Overview
Separate admin layer with credential-based auth (no Supabase auth). Admin credentials live only in Vercel env vars.

## Environment Variables (set in Vercel dashboard)

| Variable | Description |
|---|---|
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD` | Admin login password |
| `ADMIN_JWT_SECRET` | Random 64-char string for signing session tokens |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API → service_role key |

## Routes
- `/admin/login` — public login page
- `/admin` — dashboard overview stats
- `/admin/users` — list talent users, verify/unverify
- `/admin/tests` — list proficiency tests
- `/admin/tests/new` — create a test
- `/admin/tests/[id]` — edit a test
- `/admin/tests/[id]/results` — view attempt results

## Verification System
Admin manually marks talent users as verified. `is_verified` and `verified_at` fields on `user_profiles`. Verified badge shown on profile cards and profile page.

## Proficiency Test System
- Admin creates multiple-choice tests linked to a skill category
- Questions stored as JSONB: `[{id, text, options[], correct}]`
- Talent takes tests; answers submitted via `submit_test_attempt()` Postgres SECURITY DEFINER function
- Correct answers never exposed to client
- Score calculated server-side; result stored in `test_attempts`
- One attempt per user per test (upsert on retry)
- Passed tests shown as proficiency badges on profile

## Auth Flow
1. POST /api/admin/login with {email, password}
2. Server compares against env vars
3. On match: create HMAC-SHA256 signed token, set httpOnly cookie (8h)
4. Middleware verifies cookie on all /admin/* requests
5. POST /api/admin/logout clears cookie
