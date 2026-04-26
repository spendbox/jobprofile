-- Portfolio items table
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label       text        NOT NULL,
  type        text        NOT NULL CHECK (type IN ('image', 'document', 'link', 'video')),
  file_path   text,
  file_url    text,
  external_url text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- Public read (portfolio items are intentionally public — shown on profiles)
CREATE POLICY "portfolio_items_select" ON public.portfolio_items
  FOR SELECT USING (true);

CREATE POLICY "portfolio_items_insert" ON public.portfolio_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "portfolio_items_update" ON public.portfolio_items
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "portfolio_items_delete" ON public.portfolio_items
  FOR DELETE USING (auth.uid() = user_id);

-- New columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cv_data          jsonb,
  ADD COLUMN IF NOT EXISTS cv_file_path     text,
  ADD COLUMN IF NOT EXISTS portfolio_item_ids uuid[] NOT NULL DEFAULT '{}';

-- Portfolio storage bucket (public — work samples are public content)
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
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "portfolio_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "portfolio_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "portfolio_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);
