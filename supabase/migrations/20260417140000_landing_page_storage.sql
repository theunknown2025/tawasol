-- Images et médias pour l’éditeur de landing page (super admin)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'landing_page',
  'landing_page',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "landing_page_objects_select" ON storage.objects;
CREATE POLICY "landing_page_objects_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'landing_page');

DROP POLICY IF EXISTS "landing_page_objects_insert" ON storage.objects;
CREATE POLICY "landing_page_objects_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'landing_page' AND public.is_super_admin());

DROP POLICY IF EXISTS "landing_page_objects_update" ON storage.objects;
CREATE POLICY "landing_page_objects_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'landing_page' AND public.is_super_admin())
  WITH CHECK (bucket_id = 'landing_page' AND public.is_super_admin());

DROP POLICY IF EXISTS "landing_page_objects_delete" ON storage.objects;
CREATE POLICY "landing_page_objects_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'landing_page' AND public.is_super_admin());
