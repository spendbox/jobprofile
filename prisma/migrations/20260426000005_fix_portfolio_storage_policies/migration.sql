-- Drop any existing portfolio storage policies (handles naming conflicts from partial runs)
DROP POLICY IF EXISTS "portfolio_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_storage_delete" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_storage_select" ON storage.objects;

-- Ensure the bucket exists with correct settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio', 'portfolio', true, 20971520,
  ARRAY[
    'image/jpeg','image/png','image/webp','image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4','video/webm'
  ]
) ON CONFLICT (id) DO UPDATE
  SET public            = true,
      file_size_limit   = 20971520,
      allowed_mime_types = ARRAY[
        'image/jpeg','image/png','image/webp','image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4','video/webm'
      ];

-- Public read (bucket is public, but RLS on storage.objects must also allow SELECT)
CREATE POLICY "portfolio_storage_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolio');

-- Authenticated users may upload to their own folder only
CREATE POLICY "portfolio_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Required for x-upsert:true (overwriting existing files)
CREATE POLICY "portfolio_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'portfolio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'portfolio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users may delete their own files
CREATE POLICY "portfolio_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'portfolio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
