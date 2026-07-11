-- Allow deleting files metadata and storage objects
DROP POLICY IF EXISTS "Public delete files" ON public.files;
CREATE POLICY "Public delete files"
  ON public.files
  FOR DELETE
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public delete shared-files" ON storage.objects;
CREATE POLICY "Public delete shared-files"
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'shared-files');
