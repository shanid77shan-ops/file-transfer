-- Allow renaming shared items (requires SELECT policy which already exists)
DROP POLICY IF EXISTS "Public update files" ON public.files;
CREATE POLICY "Public update files"
  ON public.files
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
