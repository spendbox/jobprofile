-- Add star_rating and notes columns to talent_find_candidates
-- Run manually in Supabase dashboard SQL editor

ALTER TABLE public.talent_find_candidates
  ADD COLUMN IF NOT EXISTS star_rating smallint CHECK (star_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS notes text;
