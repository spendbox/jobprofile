-- Interview details: method, link, notes, offer text, offer acceptance
ALTER TABLE public.interview_requests
  ADD COLUMN IF NOT EXISTS interview_method text,
  ADD COLUMN IF NOT EXISTS interview_link    text,
  ADD COLUMN IF NOT EXISTS interview_notes   text,
  ADD COLUMN IF NOT EXISTS offer_details     text,
  ADD COLUMN IF NOT EXISTS offer_accepted    boolean DEFAULT false;

-- Email PIN verification table (separate from Supabase email confirmation)
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code       text        NOT NULL,
  expires_at timestamptz NOT NULL,
  used       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage own verifications" ON public.email_verifications;
CREATE POLICY "users manage own verifications" ON public.email_verifications
  FOR ALL USING (auth.uid() = user_id);

-- email_verified flag on user_profiles (different from Supabase email_confirmed_at)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;
