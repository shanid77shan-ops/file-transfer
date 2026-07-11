-- File Transfer: Supabase schema, storage bucket, and policies
-- Run this in the Supabase SQL Editor (Dashboard -> SQL -> New query)

-- 1. Files metadata table
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  size BIGINT NOT NULL CHECK (size >= 0),
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS files_created_at_idx ON public.files (created_at DESC);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Public read/write for a personal sharing app (no auth).
-- Tighten these policies once you add authentication.
DROP POLICY IF EXISTS "Public read files" ON public.files;
CREATE POLICY "Public read files"
  ON public.files
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public insert files" ON public.files;
CREATE POLICY "Public insert files"
  ON public.files
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 2. Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('shared-files', 'shared-files', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

-- 3. Storage policies
DROP POLICY IF EXISTS "Public read shared-files" ON storage.objects;
CREATE POLICY "Public read shared-files"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'shared-files');

DROP POLICY IF EXISTS "Public upload shared-files" ON storage.objects;
CREATE POLICY "Public upload shared-files"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'shared-files');
