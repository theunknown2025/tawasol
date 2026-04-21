-- Section « À propos du REMESS » : mission + valeurs (JSON singleton).
-- Étend le bucket landing_page pour les PDF (charte, plaquette, etc.).

CREATE TABLE IF NOT EXISTS public.lp_landing_a_propos_remess (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS lp_landing_a_propos_remess_touch ON public.lp_landing_a_propos_remess;
CREATE TRIGGER lp_landing_a_propos_remess_touch
  BEFORE UPDATE ON public.lp_landing_a_propos_remess
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

ALTER TABLE public.lp_landing_a_propos_remess ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_landing_apr_select" ON public.lp_landing_a_propos_remess;
CREATE POLICY "lp_landing_apr_select" ON public.lp_landing_a_propos_remess
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_apr_insert" ON public.lp_landing_a_propos_remess;
CREATE POLICY "lp_landing_apr_insert" ON public.lp_landing_a_propos_remess
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_apr_update" ON public.lp_landing_a_propos_remess;
CREATE POLICY "lp_landing_apr_update" ON public.lp_landing_a_propos_remess
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_apr_delete" ON public.lp_landing_a_propos_remess;
CREATE POLICY "lp_landing_apr_delete" ON public.lp_landing_a_propos_remess
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

COMMENT ON TABLE public.lp_landing_a_propos_remess IS 'Contenu JSON section À propos du REMESS LP (singleton default).';

UPDATE storage.buckets
SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf'
  ]::text[]
WHERE id = 'landing_page';
