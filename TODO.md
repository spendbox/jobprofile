# Pending Work

## Pipeline Page (`/dashboard/employer/pipeline/[id]/page.tsx`) — full rewrite needed

- [ ] **Inline accordion expansion** — clicking a candidate row expands their profile inline below the row (no separate side panel). Show avatar, skills, bio, experience, AI score, screening Q&A, notes, star rating, stage nav, actions.
- [ ] **Uncontacted tab** — show `talent_find_candidates` where `contacted=false`. Include select-all checkbox, per-row checkbox, bulk "Invite Selected" button, and individual "Invite" button per row. Inviting calls `POST /api/talent-finds/[id]/contact`.
- [ ] **Stage nav buttons fixed** — currently hidden for all "discovered" stage candidates (which is everyone). Employers should be able to move candidates through `interview → offer → hired`. For `discovered` (awaiting talent response) show a "Waiting for response" label + no buttons. For `interested` show only next→Interview. For `interview/offer/hired` show full prev/next.
- [ ] **Unarchive candidates** — add an "Unarchive" button that sets `archived=false` on `interview_requests`.
- [ ] **Notes** — save to `talent_find_candidates` (pipeline-specific) via `PATCH /api/talent-finds/[id]/candidates/[profileId]`. Currently broken because it tries to save to `interview_requests`.
- [ ] **Star ratings** — save to `talent_find_candidates` (pipeline-specific) via the same PATCH endpoint. Currently saved to `interview_requests` which is shared across all pipelines.
- [ ] **"Discover more" button** — wire the sidebar button to `POST /api/talent-finds/[id]/candidates` (endpoint already exists) to rescore new profiles added after pipeline creation. Show loading state + result count.
- [ ] **loadData refactor** — fetch both `talent_find_candidates` (full pool) and `interview_requests` (pipeline progress) separately. Uncontacted view uses TFC; stage views use interview_requests.

## Navigation

- [ ] **BottomNav hidden for employers** — currently shows a single "Dashboard" tab on mobile for employers. Remove it entirely for employers; they only need the top navbar avatar dropdown.

## Candidate Inbox (`/app/requests/page.tsx`)

- [ ] **Job spec view** — for talent-find-backed requests, show the full job details (role, description, salary, requirements) in the expanded card.
- [ ] **Screening question answers** — allow talent to answer `custom_questions` inline in their inbox. Answers saved to `interview_requests.question_answers`. Disabled after submitting.
- [ ] **Interest response** — prominent "I'm Interested" (sets `status=accepted`, `stage=interested`) and "Not Interested" (sets `status=declined`) buttons for pending requests. These are the only actions that move a candidate to the "interested" stage in the employer's pipeline.

## Database

- [ ] **Run migration** `20260428000001_tfc_rating_notes` in Supabase — adds `star_rating` and `notes` columns to `talent_find_candidates`. Must be applied manually in Supabase dashboard SQL editor (same process as the talent_finds migration).
