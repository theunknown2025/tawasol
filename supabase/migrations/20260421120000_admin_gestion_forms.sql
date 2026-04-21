-- Gestion Form: builder data + public banners for visitors

CREATE TABLE IF NOT EXISTS public.admin_gestion_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  banner_url text NOT NULL DEFAULT '',
  form_description text NOT NULL DEFAULT '',
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  submit_message_enabled boolean NOT NULL DEFAULT false,
  submit_message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_gestion_forms_created_by_idx
  ON public.admin_gestion_forms (created_by);

CREATE INDEX IF NOT EXISTS admin_gestion_forms_status_idx
  ON public.admin_gestion_forms (status);

ALTER TABLE public.admin_gestion_forms ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.admin_gestion_forms_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_gestion_forms_set_updated_at ON public.admin_gestion_forms;
CREATE TRIGGER admin_gestion_forms_set_updated_at
  BEFORE UPDATE ON public.admin_gestion_forms
  FOR EACH ROW EXECUTE FUNCTION public.admin_gestion_forms_set_updated_at();

DROP POLICY IF EXISTS "admin_gestion_forms_select_published_anon" ON public.admin_gestion_forms;
CREATE POLICY "admin_gestion_forms_select_published_anon" ON public.admin_gestion_forms
  FOR SELECT TO anon
  USING (status = 'published');

DROP POLICY IF EXISTS "admin_gestion_forms_select_auth" ON public.admin_gestion_forms;
CREATE POLICY "admin_gestion_forms_select_auth" ON public.admin_gestion_forms
  FOR SELECT TO authenticated
  USING (
    status = 'published'
    OR created_by = auth.uid()
    OR public.is_org_admin()
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "admin_gestion_forms_insert" ON public.admin_gestion_forms;
CREATE POLICY "admin_gestion_forms_insert" ON public.admin_gestion_forms
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (public.is_org_admin() OR public.is_super_admin())
  );

DROP POLICY IF EXISTS "admin_gestion_forms_update" ON public.admin_gestion_forms;
CREATE POLICY "admin_gestion_forms_update" ON public.admin_gestion_forms
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    AND (public.is_org_admin() OR public.is_super_admin())
  )
  WITH CHECK (
    created_by = auth.uid()
    AND (public.is_org_admin() OR public.is_super_admin())
  );

DROP POLICY IF EXISTS "admin_gestion_forms_delete" ON public.admin_gestion_forms;
CREATE POLICY "admin_gestion_forms_delete" ON public.admin_gestion_forms
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    AND (public.is_org_admin() OR public.is_super_admin())
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gestion-forms-banners',
  'gestion-forms-banners',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "gestion_forms_banners_select_public" ON storage.objects;
CREATE POLICY "gestion_forms_banners_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'gestion-forms-banners');

DROP POLICY IF EXISTS "gestion_forms_banners_insert_admin" ON storage.objects;
CREATE POLICY "gestion_forms_banners_insert_admin" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'gestion-forms-banners'
    AND (public.is_org_admin() OR public.is_super_admin())
  );

DROP POLICY IF EXISTS "gestion_forms_banners_update_admin" ON storage.objects;
CREATE POLICY "gestion_forms_banners_update_admin" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'gestion-forms-banners'
    AND (public.is_org_admin() OR public.is_super_admin())
  )
  WITH CHECK (
    bucket_id = 'gestion-forms-banners'
    AND (public.is_org_admin() OR public.is_super_admin())
  );

DROP POLICY IF EXISTS "gestion_forms_banners_delete_admin" ON storage.objects;
CREATE POLICY "gestion_forms_banners_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'gestion-forms-banners'
    AND (public.is_org_admin() OR public.is_super_admin())
  );
