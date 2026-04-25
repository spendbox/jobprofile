-- Make the cvs bucket public so getPublicUrl() links resolve without auth.
UPDATE storage.buckets SET public = true WHERE id = 'cvs';

-- CV library: one row per uploaded file, belonging to a user.
-- Profiles reference a cv_url (public URL); user_cvs is the source of truth
-- for the user's uploaded files so they can be managed independently.
CREATE TABLE IF NOT EXISTS public.user_cvs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  display_name text        NOT NULL,
  file_path    text        NOT NULL,
  file_url     text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_cvs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_cvs_select" ON public.user_cvs;
CREATE POLICY "user_cvs_select" ON public.user_cvs
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_cvs_insert" ON public.user_cvs;
CREATE POLICY "user_cvs_insert" ON public.user_cvs
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_cvs_delete" ON public.user_cvs;
CREATE POLICY "user_cvs_delete" ON public.user_cvs
  FOR DELETE USING (user_id = auth.uid());
