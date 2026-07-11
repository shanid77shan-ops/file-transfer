-- Increase shared-files bucket limit for large high-quality uploads (up to 5GB).
-- Note: Your Supabase plan may cap this (e.g. 50MB free, 50GB Pro).
UPDATE storage.buckets
SET file_size_limit = 5368709120
WHERE id = 'shared-files';
