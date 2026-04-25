-- Storage upsert (upload with overwrite) requires INSERT + SELECT + UPDATE.
-- The initial schema only granted INSERT for authenticated uploaders.
-- Without UPDATE, replacing an existing file silently fails.

DROP POLICY IF EXISTS "Auth update CVs"     ON storage.objects;
DROP POLICY IF EXISTS "Auth update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth update videos"  ON storage.objects;

CREATE POLICY "Auth update CVs"
  ON storage.objects FOR UPDATE
  USING     (bucket_id = 'cvs'     AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'cvs'     AND auth.role() = 'authenticated');

CREATE POLICY "Auth update avatars"
  ON storage.objects FOR UPDATE
  USING     (bucket_id = 'avatars' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Auth update videos"
  ON storage.objects FOR UPDATE
  USING     (bucket_id = 'videos'  AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'videos'  AND auth.role() = 'authenticated');
