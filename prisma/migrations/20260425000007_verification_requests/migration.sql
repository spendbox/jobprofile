-- Add verification document fields to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS verification_doc_path text,
  ADD COLUMN IF NOT EXISTS verification_requested_at timestamptz;

-- Create private bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Talent can upload their own verification doc
DROP POLICY IF EXISTS "verification_docs_own_insert" ON storage.objects;
CREATE POLICY "verification_docs_own_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'verification-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Talent can replace/update their own doc
DROP POLICY IF EXISTS "verification_docs_own_update" ON storage.objects;
CREATE POLICY "verification_docs_own_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'verification-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Talent can read their own doc (for re-upload confirmation)
DROP POLICY IF EXISTS "verification_docs_own_select" ON storage.objects;
CREATE POLICY "verification_docs_own_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
