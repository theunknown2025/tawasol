-- Event form registration file uploads (CV / documents)

ALTER TABLE public.event_form_registrations
  ADD COLUMN IF NOT EXISTS file_uploads jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.event_form_registrations.file_uploads IS
  'Map field label -> { url, path, fileName } for uploaded documents';

-- Allow org / super admins to read registrations (in addition to event author)
DROP POLICY IF EXISTS "event_form_registrations_select_admin" ON public.event_form_registrations;
CREATE POLICY "event_form_registrations_select_admin" ON public.event_form_registrations
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR public.is_org_admin()
    OR EXISTS (
      SELECT 1
      FROM public.evenements e
      WHERE e.id = event_id
        AND e.author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "event_form_registrations_update_admin" ON public.event_form_registrations;
CREATE POLICY "event_form_registrations_update_admin" ON public.event_form_registrations
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR public.is_org_admin()
    OR EXISTS (
      SELECT 1
      FROM public.evenements e
      WHERE e.id = event_id
        AND e.author_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR public.is_org_admin()
    OR EXISTS (
      SELECT 1
      FROM public.evenements e
      WHERE e.id = event_id
        AND e.author_id = auth.uid()
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-registration-files',
  'event-registration-files',
  false,
  20971520,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "event_reg_files_insert_public" ON storage.objects;
CREATE POLICY "event_reg_files_insert_public" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'event-registration-files');

DROP POLICY IF EXISTS "event_reg_files_select_admin" ON storage.objects;
CREATE POLICY "event_reg_files_select_admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'event-registration-files'
    AND (public.is_super_admin() OR public.is_org_admin())
  );

DROP POLICY IF EXISTS "event_reg_files_delete_admin" ON storage.objects;
CREATE POLICY "event_reg_files_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'event-registration-files'
    AND (public.is_super_admin() OR public.is_org_admin())
  );
