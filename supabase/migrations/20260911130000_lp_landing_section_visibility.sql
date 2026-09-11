-- Visibilité on/off de chaque section de la landing (et du header).
-- Singleton JSON : Record<LandingPageSectionLabel, boolean> — true = affiché sur la page publique.

CREATE TABLE IF NOT EXISTS public.lp_landing_section_visibility (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS lp_landing_section_visibility_touch ON public.lp_landing_section_visibility;
CREATE TRIGGER lp_landing_section_visibility_touch
  BEFORE UPDATE ON public.lp_landing_section_visibility
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

ALTER TABLE public.lp_landing_section_visibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_landing_section_visibility_select" ON public.lp_landing_section_visibility;
CREATE POLICY "lp_landing_section_visibility_select" ON public.lp_landing_section_visibility
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_section_visibility_insert" ON public.lp_landing_section_visibility;
CREATE POLICY "lp_landing_section_visibility_insert" ON public.lp_landing_section_visibility
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_section_visibility_update" ON public.lp_landing_section_visibility;
CREATE POLICY "lp_landing_section_visibility_update" ON public.lp_landing_section_visibility
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_section_visibility_delete" ON public.lp_landing_section_visibility;
CREATE POLICY "lp_landing_section_visibility_delete" ON public.lp_landing_section_visibility
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

GRANT SELECT ON TABLE public.lp_landing_section_visibility TO anon, authenticated;

DROP POLICY IF EXISTS "lp_landing_section_visibility_select_anon" ON public.lp_landing_section_visibility;
CREATE POLICY "lp_landing_section_visibility_select_anon" ON public.lp_landing_section_visibility
  FOR SELECT TO anon
  USING (id = 'default');

DROP POLICY IF EXISTS "lp_landing_section_visibility_select_public_auth" ON public.lp_landing_section_visibility;
CREATE POLICY "lp_landing_section_visibility_select_public_auth" ON public.lp_landing_section_visibility
  FOR SELECT TO authenticated
  USING (id = 'default');

COMMENT ON TABLE public.lp_landing_section_visibility IS
  'Visibilité on/off des sections landing (singleton default). Clés = labels LANDING_PAGE_SECTION_LABELS.';
