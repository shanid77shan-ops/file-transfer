-- Ensure shared-files bucket allows large uploads (global Supabase limit still applies).
-- Free tier: max 50 MB global. Pro: up to 500 GB in Dashboard → Storage → Settings.
UPDATE storage.buckets
SET
  file_size_limit = 5368709120,
  allowed_mime_types = NULL
WHERE id = 'shared-files';
