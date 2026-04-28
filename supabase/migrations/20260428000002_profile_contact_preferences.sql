ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_contact text,
  ADD COLUMN IF NOT EXISTS work_arrangement_preference text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS willing_to_travel boolean DEFAULT false;
