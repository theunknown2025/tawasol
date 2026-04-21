-- Section « Nos membres » (Membres REMESS) : cartes org + représentant en JSON singleton.
-- Logos : bucket public `landing_page`, préfixe logique `nos-membres/`.

CREATE TABLE IF NOT EXISTS public.lp_landing_nos_membres (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  payload jsonb NOT NULL DEFAULT '{"entries":[]}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS lp_landing_nos_membres_touch ON public.lp_landing_nos_membres;
CREATE TRIGGER lp_landing_nos_membres_touch
  BEFORE UPDATE ON public.lp_landing_nos_membres
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

ALTER TABLE public.lp_landing_nos_membres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_landing_nos_membres_select" ON public.lp_landing_nos_membres;
CREATE POLICY "lp_landing_nos_membres_select" ON public.lp_landing_nos_membres
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_nos_membres_insert" ON public.lp_landing_nos_membres;
CREATE POLICY "lp_landing_nos_membres_insert" ON public.lp_landing_nos_membres
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_nos_membres_update" ON public.lp_landing_nos_membres;
CREATE POLICY "lp_landing_nos_membres_update" ON public.lp_landing_nos_membres
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_nos_membres_delete" ON public.lp_landing_nos_membres;
CREATE POLICY "lp_landing_nos_membres_delete" ON public.lp_landing_nos_membres
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

GRANT SELECT ON TABLE public.lp_landing_nos_membres TO anon, authenticated;

DROP POLICY IF EXISTS "lp_landing_nos_membres_select_anon" ON public.lp_landing_nos_membres;
CREATE POLICY "lp_landing_nos_membres_select_anon" ON public.lp_landing_nos_membres
  FOR SELECT TO anon
  USING (id = 'default');

DROP POLICY IF EXISTS "lp_landing_nos_membres_select_public_auth" ON public.lp_landing_nos_membres;
CREATE POLICY "lp_landing_nos_membres_select_public_auth" ON public.lp_landing_nos_membres
  FOR SELECT TO authenticated
  USING (id = 'default');

COMMENT ON TABLE public.lp_landing_nos_membres IS 'Contenu JSON section Nos membres LP (singleton). Images dans storage `landing_page`, dossier nos-membres/.';
