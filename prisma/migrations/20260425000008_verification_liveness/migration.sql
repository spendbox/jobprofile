-- Add legal name and liveness video fields to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS verification_legal_name text,
  ADD COLUMN IF NOT EXISTS verification_liveness_path text;
