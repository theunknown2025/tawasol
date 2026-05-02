-- Footer section for landing page editor + public rendering.
-- Includes singleton table (JSON payload) and a dedicated public bucket for footer assets.

CREATE TABLE IF NOT EXISTS public.lp_landing_footer (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS lp_landing_footer_touch ON public.lp_landing_footer;
CREATE TRIGGER lp_landing_footer_touch
  BEFORE UPDATE ON public.lp_landing_footer
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

ALTER TABLE public.lp_landing_footer ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_landing_footer_select" ON public.lp_landing_footer;
CREATE POLICY "lp_landing_footer_select" ON public.lp_landing_footer
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_footer_insert" ON public.lp_landing_footer;
CREATE POLICY "lp_landing_footer_insert" ON public.lp_landing_footer
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_footer_update" ON public.lp_landing_footer;
CREATE POLICY "lp_landing_footer_update" ON public.lp_landing_footer
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_footer_delete" ON public.lp_landing_footer;
CREATE POLICY "lp_landing_footer_delete" ON public.lp_landing_footer
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_footer_select_anon" ON public.lp_landing_footer;
CREATE POLICY "lp_landing_footer_select_anon" ON public.lp_landing_footer
  FOR SELECT TO anon
  USING (id = 'default');

COMMENT ON TABLE public.lp_landing_footer IS 'Contenu JSON du footer LP (singleton default).';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'landing_footer',
  'landing_footer',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "landing_footer_objects_select" ON storage.objects;
CREATE POLICY "landing_footer_objects_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'landing_footer');

DROP POLICY IF EXISTS "landing_footer_objects_insert" ON storage.objects;
CREATE POLICY "landing_footer_objects_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'landing_footer' AND public.is_super_admin());

DROP POLICY IF EXISTS "landing_footer_objects_update" ON storage.objects;
CREATE POLICY "landing_footer_objects_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'landing_footer' AND public.is_super_admin())
  WITH CHECK (bucket_id = 'landing_footer' AND public.is_super_admin());

DROP POLICY IF EXISTS "landing_footer_objects_delete" ON storage.objects;
CREATE POLICY "landing_footer_objects_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'landing_footer' AND public.is_super_admin());
