-- Add FKs that PostgREST needs to resolve embedded resource joins.
--
-- profiles.user_id already references auth.users(id). PostgREST does not
-- expose auth.users, so it cannot follow that FK to reach user_profiles.
-- Adding a second FK directly to user_profiles.id lets PostgREST join
-- profiles → user_profiles without ambiguity.
--
-- NOT VALID skips re-checking existing rows (safe for MVP — any orphaned
-- rows from before the trigger was in place just return null for the join).

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_id_user_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE
  NOT VALID;

ALTER TABLE public.interview_requests
  ADD CONSTRAINT ir_employer_user_profiles_fkey
  FOREIGN KEY (employer_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE
  NOT VALID;

-- Batch version of increment_times_shown — single DB round-trip for a page of results.
CREATE OR REPLACE FUNCTION public.increment_times_shown_batch(profile_ids UUID[])
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles SET times_shown = times_shown + 1
  WHERE id = ANY(profile_ids);
END;
$$;
