ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS company_website text,
  ADD COLUMN IF NOT EXISTS company_contact_email text,
  ADD COLUMN IF NOT EXISTS company_description text,
  ADD COLUMN IF NOT EXISTS company_hq_country text,
  ADD COLUMN IF NOT EXISTS company_hq_state text,
  ADD COLUMN IF NOT EXISTS company_timezone text,
  ADD COLUMN IF NOT EXISTS company_profile_complete boolean DEFAULT false;
