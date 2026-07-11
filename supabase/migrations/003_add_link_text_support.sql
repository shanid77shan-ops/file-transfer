-- Add support for pasted links and plain text items
ALTER TABLE public.files
ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'file'
CHECK (item_type IN ('file', 'link', 'text'));

ALTER TABLE public.files
ADD COLUMN IF NOT EXISTS text_content TEXT;

-- Allow non-file items without storage objects
ALTER TABLE public.files
ALTER COLUMN storage_path DROP NOT NULL;

-- Drop unique constraint on storage_path if it blocks multiple text/link rows
ALTER TABLE public.files
DROP CONSTRAINT IF EXISTS files_storage_path_key;

CREATE UNIQUE INDEX IF NOT EXISTS files_storage_path_unique_idx
ON public.files (storage_path)
WHERE storage_path IS NOT NULL;
