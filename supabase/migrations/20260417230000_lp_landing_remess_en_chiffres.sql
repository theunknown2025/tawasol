-- Section « REMESS en chiffres » : sous-titre + liste de statistiques (JSON singleton).

CREATE TABLE IF NOT EXISTS public.lp_landing_remess_en_chiffres (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS lp_landing_rec_touch ON public.lp_landing_remess_en_chiffres;
CREATE TRIGGER lp_landing_rec_touch
  BEFORE UPDATE ON public.lp_landing_remess_en_chiffres
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

ALTER TABLE public.lp_landing_remess_en_chiffres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_landing_rec_select" ON public.lp_landing_remess_en_chiffres;
CREATE POLICY "lp_landing_rec_select" ON public.lp_landing_remess_en_chiffres
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_rec_insert" ON public.lp_landing_remess_en_chiffres;
CREATE POLICY "lp_landing_rec_insert" ON public.lp_landing_remess_en_chiffres
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_rec_update" ON public.lp_landing_remess_en_chiffres;
CREATE POLICY "lp_landing_rec_update" ON public.lp_landing_remess_en_chiffres
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_rec_delete" ON public.lp_landing_remess_en_chiffres;
CREATE POLICY "lp_landing_rec_delete" ON public.lp_landing_remess_en_chiffres
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

COMMENT ON TABLE public.lp_landing_remess_en_chiffres IS 'Contenu JSON section REMESS en chiffres LP (singleton default).';
