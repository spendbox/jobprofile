-- ATS enhancements: archive flag, candidate notes, job openings

-- Archive flag on interview_requests
ALTER TABLE public.interview_requests
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

-- Free-text notes per request (employer-internal)
ALTER TABLE public.interview_requests
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Job openings table (employer-managed role groupings)
CREATE TABLE IF NOT EXISTS public.job_openings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employer manages own openings" ON public.job_openings
  USING  (auth.uid() = employer_id)
  WITH CHECK (auth.uid() = employer_id);

-- Link interview_requests to a job opening (nullable)
ALTER TABLE public.interview_requests
  ADD COLUMN IF NOT EXISTS opening_id UUID REFERENCES public.job_openings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS interview_requests_opening_idx
  ON public.interview_requests (opening_id);
