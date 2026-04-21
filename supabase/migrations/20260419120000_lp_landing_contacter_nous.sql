-- Section « Contacter nous » : adresse, téléphones, e-mail, URL Google Maps et coordonnées (JSON singleton).

CREATE TABLE IF NOT EXISTS public.lp_landing_contacter_nous (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  payload jsonb NOT NULL DEFAULT '{"address":"","phone":"","whatsapp":"","email":"","googleMapsUrl":"","latitude":null,"longitude":null}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS lp_landing_contacter_nous_touch ON public.lp_landing_contacter_nous;
CREATE TRIGGER lp_landing_contacter_nous_touch
  BEFORE UPDATE ON public.lp_landing_contacter_nous
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

ALTER TABLE public.lp_landing_contacter_nous ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_landing_contacter_nous_select" ON public.lp_landing_contacter_nous;
CREATE POLICY "lp_landing_contacter_nous_select" ON public.lp_landing_contacter_nous
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_contacter_nous_insert" ON public.lp_landing_contacter_nous;
CREATE POLICY "lp_landing_contacter_nous_insert" ON public.lp_landing_contacter_nous
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_contacter_nous_update" ON public.lp_landing_contacter_nous;
CREATE POLICY "lp_landing_contacter_nous_update" ON public.lp_landing_contacter_nous
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_contacter_nous_delete" ON public.lp_landing_contacter_nous;
CREATE POLICY "lp_landing_contacter_nous_delete" ON public.lp_landing_contacter_nous
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

GRANT SELECT ON TABLE public.lp_landing_contacter_nous TO anon, authenticated;

DROP POLICY IF EXISTS "lp_landing_contacter_nous_select_anon" ON public.lp_landing_contacter_nous;
CREATE POLICY "lp_landing_contacter_nous_select_anon" ON public.lp_landing_contacter_nous
  FOR SELECT TO anon
  USING (id = 'default');

DROP POLICY IF EXISTS "lp_landing_contacter_nous_select_public_auth" ON public.lp_landing_contacter_nous;
CREATE POLICY "lp_landing_contacter_nous_select_public_auth" ON public.lp_landing_contacter_nous
  FOR SELECT TO authenticated
  USING (id = 'default');

COMMENT ON TABLE public.lp_landing_contacter_nous IS 'Contenu JSON section Contacter nous LP (singleton). payload: adresse, téléphones, email, URL Maps, latitude/longitude.';
