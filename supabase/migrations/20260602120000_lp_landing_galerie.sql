-- Section « Galerie » : catalogues et photos en JSON singleton.
-- Images : bucket public `landing_page`, préfixe logique `galerie/`.

CREATE TABLE IF NOT EXISTS public.lp_landing_galerie (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  payload jsonb NOT NULL DEFAULT '{"catalogues":[]}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS lp_landing_galerie_touch ON public.lp_landing_galerie;
CREATE TRIGGER lp_landing_galerie_touch
  BEFORE UPDATE ON public.lp_landing_galerie
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

ALTER TABLE public.lp_landing_galerie ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_landing_galerie_select" ON public.lp_landing_galerie;
CREATE POLICY "lp_landing_galerie_select" ON public.lp_landing_galerie
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_galerie_insert" ON public.lp_landing_galerie;
CREATE POLICY "lp_landing_galerie_insert" ON public.lp_landing_galerie
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_galerie_update" ON public.lp_landing_galerie;
CREATE POLICY "lp_landing_galerie_update" ON public.lp_landing_galerie
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_galerie_delete" ON public.lp_landing_galerie;
CREATE POLICY "lp_landing_galerie_delete" ON public.lp_landing_galerie
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

GRANT SELECT ON TABLE public.lp_landing_galerie TO anon, authenticated;

DROP POLICY IF EXISTS "lp_landing_galerie_select_anon" ON public.lp_landing_galerie;
CREATE POLICY "lp_landing_galerie_select_anon" ON public.lp_landing_galerie
  FOR SELECT TO anon
  USING (id = 'default');

DROP POLICY IF EXISTS "lp_landing_galerie_select_public_auth" ON public.lp_landing_galerie;
CREATE POLICY "lp_landing_galerie_select_public_auth" ON public.lp_landing_galerie
  FOR SELECT TO authenticated
  USING (id = 'default');

COMMENT ON TABLE public.lp_landing_galerie IS 'Contenu JSON section Galerie LP (singleton). Images dans storage `landing_page`, dossier galerie/.';
