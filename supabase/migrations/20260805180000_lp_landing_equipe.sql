-- Section « Équipe » (distincte du Conseil Administrative / lp_landing_equipe_remess).
-- Membres : photo, nom, fonction, bio, LinkedIn, email — JSON singleton.
-- Photos : bucket `landing_page`, préfixe logique `equipe/`.

CREATE TABLE IF NOT EXISTS public.lp_landing_equipe (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  payload jsonb NOT NULL DEFAULT '{"members":[]}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS lp_landing_equipe_section_touch ON public.lp_landing_equipe;
CREATE TRIGGER lp_landing_equipe_section_touch
  BEFORE UPDATE ON public.lp_landing_equipe
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

ALTER TABLE public.lp_landing_equipe ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_landing_equipe_section_select" ON public.lp_landing_equipe;
CREATE POLICY "lp_landing_equipe_section_select" ON public.lp_landing_equipe
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_equipe_section_insert" ON public.lp_landing_equipe;
CREATE POLICY "lp_landing_equipe_section_insert" ON public.lp_landing_equipe
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_equipe_section_update" ON public.lp_landing_equipe;
CREATE POLICY "lp_landing_equipe_section_update" ON public.lp_landing_equipe
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_equipe_section_delete" ON public.lp_landing_equipe;
CREATE POLICY "lp_landing_equipe_section_delete" ON public.lp_landing_equipe
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

GRANT SELECT ON TABLE public.lp_landing_equipe TO anon, authenticated;

DROP POLICY IF EXISTS "lp_landing_equipe_section_select_anon" ON public.lp_landing_equipe;
CREATE POLICY "lp_landing_equipe_section_select_anon" ON public.lp_landing_equipe
  FOR SELECT TO anon
  USING (id = 'default');

DROP POLICY IF EXISTS "lp_landing_equipe_section_select_public_auth" ON public.lp_landing_equipe;
CREATE POLICY "lp_landing_equipe_section_select_public_auth" ON public.lp_landing_equipe
  FOR SELECT TO authenticated
  USING (id = 'default');

COMMENT ON TABLE public.lp_landing_equipe IS 'Contenu JSON section Équipe LP (singleton default). Images dans storage landing_page/equipe/.';
