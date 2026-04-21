-- Allow anonymous reads of landing page JSON (singleton) for the public marketing site.
-- Header already has lp_landing_header_select_anon from a prior migration.

DROP POLICY IF EXISTS "lp_landing_hero_select_anon" ON public.lp_landing_hero;
CREATE POLICY "lp_landing_hero_select_anon" ON public.lp_landing_hero
  FOR SELECT TO anon
  USING (id = 'default');

DROP POLICY IF EXISTS "lp_landing_mdp_select_anon" ON public.lp_landing_mot_du_president;
CREATE POLICY "lp_landing_mdp_select_anon" ON public.lp_landing_mot_du_president
  FOR SELECT TO anon
  USING (id = 'default');

DROP POLICY IF EXISTS "lp_landing_apr_select_anon" ON public.lp_landing_a_propos_remess;
CREATE POLICY "lp_landing_apr_select_anon" ON public.lp_landing_a_propos_remess
  FOR SELECT TO anon
  USING (id = 'default');

DROP POLICY IF EXISTS "lp_landing_rec_select_anon" ON public.lp_landing_remess_en_chiffres;
CREATE POLICY "lp_landing_rec_select_anon" ON public.lp_landing_remess_en_chiffres
  FOR SELECT TO anon
  USING (id = 'default');
