-- Section « Équipe REMESS » : membres (photo, nom, fonction, bio max 300, LinkedIn, email) en JSON singleton.
-- Photos : bucket public existant `landing_page`, préfixe logique `equipe-remess/` (pas de bucket dédié requis).

CREATE TABLE IF NOT EXISTS public.lp_landing_equipe_remess (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  payload jsonb NOT NULL DEFAULT '{"members":[]}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS lp_landing_equipe_touch ON public.lp_landing_equipe_remess;
CREATE TRIGGER lp_landing_equipe_touch
  BEFORE UPDATE ON public.lp_landing_equipe_remess
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

ALTER TABLE public.lp_landing_equipe_remess ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_landing_equipe_select" ON public.lp_landing_equipe_remess;
CREATE POLICY "lp_landing_equipe_select" ON public.lp_landing_equipe_remess
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_equipe_insert" ON public.lp_landing_equipe_remess;
CREATE POLICY "lp_landing_equipe_insert" ON public.lp_landing_equipe_remess
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_equipe_update" ON public.lp_landing_equipe_remess;
CREATE POLICY "lp_landing_equipe_update" ON public.lp_landing_equipe_remess
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_equipe_delete" ON public.lp_landing_equipe_remess;
CREATE POLICY "lp_landing_equipe_delete" ON public.lp_landing_equipe_remess
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

GRANT SELECT ON TABLE public.lp_landing_equipe_remess TO anon, authenticated;

DROP POLICY IF EXISTS "lp_landing_equipe_select_anon" ON public.lp_landing_equipe_remess;
CREATE POLICY "lp_landing_equipe_select_anon" ON public.lp_landing_equipe_remess
  FOR SELECT TO anon
  USING (id = 'default');

DROP POLICY IF EXISTS "lp_landing_equipe_select_public_auth" ON public.lp_landing_equipe_remess;
CREATE POLICY "lp_landing_equipe_select_public_auth" ON public.lp_landing_equipe_remess
  FOR SELECT TO authenticated
  USING (id = 'default');

COMMENT ON TABLE public.lp_landing_equipe_remess IS 'Contenu JSON section Équipe REMESS LP (singleton default). Images dans storage `landing_page`, dossier equipe-remess/.';
