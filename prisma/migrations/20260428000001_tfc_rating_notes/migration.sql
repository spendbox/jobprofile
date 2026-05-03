-- Pipeline-specific star rating and notes on talent_find_candidates
-- (interview_requests has a unique constraint on employer_id+profile_id, making
--  its star_rating shared across all pipelines — these columns fix that)

ALTER TABLE public.talent_find_candidates
  ADD COLUMN IF NOT EXISTS star_rating integer CHECK (star_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS notes       text;
