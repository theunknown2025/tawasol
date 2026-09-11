-- Section « Nos partenaires » : cartes nom / logo / site / description en JSON singleton.
-- Logos : bucket public `landing_page`, préfixe logique `nos-partenaires/`.

CREATE TABLE IF NOT EXISTS public.lp_landing_nos_partenaires (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  payload jsonb NOT NULL DEFAULT '{"subtitle":"","entries":[]}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS lp_landing_nos_partenaires_touch ON public.lp_landing_nos_partenaires;
CREATE TRIGGER lp_landing_nos_partenaires_touch
  BEFORE UPDATE ON public.lp_landing_nos_partenaires
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

ALTER TABLE public.lp_landing_nos_partenaires ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_landing_nos_partenaires_select" ON public.lp_landing_nos_partenaires;
CREATE POLICY "lp_landing_nos_partenaires_select" ON public.lp_landing_nos_partenaires
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_nos_partenaires_insert" ON public.lp_landing_nos_partenaires;
CREATE POLICY "lp_landing_nos_partenaires_insert" ON public.lp_landing_nos_partenaires
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_nos_partenaires_update" ON public.lp_landing_nos_partenaires;
CREATE POLICY "lp_landing_nos_partenaires_update" ON public.lp_landing_nos_partenaires
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_nos_partenaires_delete" ON public.lp_landing_nos_partenaires;
CREATE POLICY "lp_landing_nos_partenaires_delete" ON public.lp_landing_nos_partenaires
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

GRANT SELECT ON TABLE public.lp_landing_nos_partenaires TO anon, authenticated;

DROP POLICY IF EXISTS "lp_landing_nos_partenaires_select_anon" ON public.lp_landing_nos_partenaires;
CREATE POLICY "lp_landing_nos_partenaires_select_anon" ON public.lp_landing_nos_partenaires
  FOR SELECT TO anon
  USING (id = 'default');

DROP POLICY IF EXISTS "lp_landing_nos_partenaires_select_public_auth" ON public.lp_landing_nos_partenaires;
CREATE POLICY "lp_landing_nos_partenaires_select_public_auth" ON public.lp_landing_nos_partenaires
  FOR SELECT TO authenticated
  USING (id = 'default');

COMMENT ON TABLE public.lp_landing_nos_partenaires IS 'Contenu JSON section Nos partenaires LP (singleton). Images dans storage `landing_page`, dossier nos-partenaires/.';
