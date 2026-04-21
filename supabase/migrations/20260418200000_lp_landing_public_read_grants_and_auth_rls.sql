-- Landing singleton JSON must be readable by everyone (visitors + any logged-in role),
-- not only super_admin. The API uses role `anon` when signed out and `authenticated` when signed in;
-- RLS policies for `anon` alone are not enough if a session is still active.

GRANT SELECT ON TABLE public.lp_landing_header TO anon, authenticated;
GRANT SELECT ON TABLE public.lp_landing_hero TO anon, authenticated;
GRANT SELECT ON TABLE public.lp_landing_mot_du_president TO anon, authenticated;
GRANT SELECT ON TABLE public.lp_landing_a_propos_remess TO anon, authenticated;
GRANT SELECT ON TABLE public.lp_landing_remess_en_chiffres TO anon, authenticated;

-- Signed-out clients (Supabase role `anon`).
DROP POLICY IF EXISTS "lp_landing_header_select_anon" ON public.lp_landing_header;
CREATE POLICY "lp_landing_header_select_anon" ON public.lp_landing_header
  FOR SELECT TO anon
  USING (id = 'default');

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

-- Signed-in clients that are not super_admin (role `authenticated`).
DROP POLICY IF EXISTS "lp_landing_header_select_public_auth" ON public.lp_landing_header;
CREATE POLICY "lp_landing_header_select_public_auth" ON public.lp_landing_header
  FOR SELECT TO authenticated
  USING (id = 'default');

DROP POLICY IF EXISTS "lp_landing_hero_select_public_auth" ON public.lp_landing_hero;
CREATE POLICY "lp_landing_hero_select_public_auth" ON public.lp_landing_hero
  FOR SELECT TO authenticated
  USING (id = 'default');

DROP POLICY IF EXISTS "lp_landing_mdp_select_public_auth" ON public.lp_landing_mot_du_president;
CREATE POLICY "lp_landing_mdp_select_public_auth" ON public.lp_landing_mot_du_president
  FOR SELECT TO authenticated
  USING (id = 'default');

DROP POLICY IF EXISTS "lp_landing_apr_select_public_auth" ON public.lp_landing_a_propos_remess;
CREATE POLICY "lp_landing_apr_select_public_auth" ON public.lp_landing_a_propos_remess
  FOR SELECT TO authenticated
  USING (id = 'default');

DROP POLICY IF EXISTS "lp_landing_rec_select_public_auth" ON public.lp_landing_remess_en_chiffres;
CREATE POLICY "lp_landing_rec_select_public_auth" ON public.lp_landing_remess_en_chiffres
  FOR SELECT TO authenticated
  USING (id = 'default');
