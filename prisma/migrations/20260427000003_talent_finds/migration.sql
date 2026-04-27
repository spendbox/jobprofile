-- Talent Finds: structured job postings with AI candidate scoring

CREATE TABLE IF NOT EXISTS public.talent_finds (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_title        text        NOT NULL,
  employment_type   text        NOT NULL CHECK (employment_type IN ('fulltime','parttime','contract','volunteer','internship')),
  work_arrangement  text        NOT NULL CHECK (work_arrangement IN ('remote','hybrid','onsite')),
  hiring_country    text,
  hiring_state      text,
  min_experience    integer,
  max_experience    integer,
  skills            text[]      NOT NULL DEFAULT '{}',
  salary_min        integer,
  salary_max        integer,
  description       text        NOT NULL,
  requirements_text text,
  custom_questions  jsonb       NOT NULL DEFAULT '[]',
  status            text        NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.talent_finds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employer manages own finds" ON public.talent_finds
  USING  (auth.uid() = employer_id)
  WITH CHECK (auth.uid() = employer_id);

-- Allow candidates to read the spec of a talent find they received a request from
CREATE POLICY "Candidates read assigned finds" ON public.talent_finds
  FOR SELECT USING (
    id IN (
      SELECT ir.talent_find_id
      FROM   public.interview_requests ir
      JOIN   public.profiles p ON p.id = ir.profile_id
      WHERE  p.user_id = auth.uid()
        AND  ir.talent_find_id IS NOT NULL
    )
  );

CREATE INDEX IF NOT EXISTS talent_finds_employer_idx ON public.talent_finds (employer_id);

CREATE TRIGGER trg_talent_finds_updated_at
  BEFORE UPDATE ON public.talent_finds
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Scored candidate pool (before contact)
CREATE TABLE IF NOT EXISTS public.talent_find_candidates (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_find_id  uuid        NOT NULL REFERENCES public.talent_finds(id) ON DELETE CASCADE,
  profile_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ai_score        integer     NOT NULL DEFAULT 0,
  ai_summary      text,
  contacted       boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (talent_find_id, profile_id)
);

ALTER TABLE public.talent_find_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employer reads own tfc" ON public.talent_find_candidates
  FOR SELECT USING (
    talent_find_id IN (SELECT id FROM public.talent_finds WHERE employer_id = auth.uid())
  );

CREATE POLICY "Employer inserts own tfc" ON public.talent_find_candidates
  FOR INSERT WITH CHECK (
    talent_find_id IN (SELECT id FROM public.talent_finds WHERE employer_id = auth.uid())
  );

CREATE POLICY "Employer updates own tfc" ON public.talent_find_candidates
  FOR UPDATE USING (
    talent_find_id IN (SELECT id FROM public.talent_finds WHERE employer_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS tfc_talent_find_idx ON public.talent_find_candidates (talent_find_id);
CREATE INDEX IF NOT EXISTS tfc_profile_idx     ON public.talent_find_candidates (profile_id);

-- Add talent_find_id, star_rating, question_answers to interview_requests
ALTER TABLE public.interview_requests
  ADD COLUMN IF NOT EXISTS talent_find_id   uuid REFERENCES public.talent_finds(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS star_rating      integer CHECK (star_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS question_answers jsonb;

CREATE INDEX IF NOT EXISTS ir_talent_find_idx ON public.interview_requests (talent_find_id);
