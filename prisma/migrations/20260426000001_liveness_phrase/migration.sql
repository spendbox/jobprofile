ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS verification_liveness_phrase TEXT;
