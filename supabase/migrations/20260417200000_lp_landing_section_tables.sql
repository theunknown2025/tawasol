-- Landing page Remess : contenu JSON par section (singleton `default`).
-- Accès : super_admin uniquement (RLS). Le bucket `landing_page` reste utilisé pour les images.

CREATE TABLE IF NOT EXISTS public.lp_landing_header (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.lp_landing_hero (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.lp_landing_mot_du_president (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE OR REPLACE FUNCTION public.lp_landing_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lp_landing_header_touch ON public.lp_landing_header;
CREATE TRIGGER lp_landing_header_touch
  BEFORE UPDATE ON public.lp_landing_header
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

DROP TRIGGER IF EXISTS lp_landing_hero_touch ON public.lp_landing_hero;
CREATE TRIGGER lp_landing_hero_touch
  BEFORE UPDATE ON public.lp_landing_hero
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

DROP TRIGGER IF EXISTS lp_landing_mot_du_president_touch ON public.lp_landing_mot_du_president;
CREATE TRIGGER lp_landing_mot_du_president_touch
  BEFORE UPDATE ON public.lp_landing_mot_du_president
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

ALTER TABLE public.lp_landing_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lp_landing_hero ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lp_landing_mot_du_president ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_landing_header_select" ON public.lp_landing_header;
CREATE POLICY "lp_landing_header_select" ON public.lp_landing_header
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_header_insert" ON public.lp_landing_header;
CREATE POLICY "lp_landing_header_insert" ON public.lp_landing_header
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_header_update" ON public.lp_landing_header;
CREATE POLICY "lp_landing_header_update" ON public.lp_landing_header
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_header_delete" ON public.lp_landing_header;
CREATE POLICY "lp_landing_header_delete" ON public.lp_landing_header
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_hero_select" ON public.lp_landing_hero;
CREATE POLICY "lp_landing_hero_select" ON public.lp_landing_hero
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_hero_insert" ON public.lp_landing_hero;
CREATE POLICY "lp_landing_hero_insert" ON public.lp_landing_hero
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_hero_update" ON public.lp_landing_hero;
CREATE POLICY "lp_landing_hero_update" ON public.lp_landing_hero
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_hero_delete" ON public.lp_landing_hero;
CREATE POLICY "lp_landing_hero_delete" ON public.lp_landing_hero
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_mdp_select" ON public.lp_landing_mot_du_president;
CREATE POLICY "lp_landing_mdp_select" ON public.lp_landing_mot_du_president
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_mdp_insert" ON public.lp_landing_mot_du_president;
CREATE POLICY "lp_landing_mdp_insert" ON public.lp_landing_mot_du_president
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_mdp_update" ON public.lp_landing_mot_du_president;
CREATE POLICY "lp_landing_mdp_update" ON public.lp_landing_mot_du_president
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_landing_mdp_delete" ON public.lp_landing_mot_du_president;
CREATE POLICY "lp_landing_mdp_delete" ON public.lp_landing_mot_du_president
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

COMMENT ON TABLE public.lp_landing_header IS 'Configuration JSON du header LP (singleton default).';
COMMENT ON TABLE public.lp_landing_hero IS 'Contenu JSON du hero LP (singleton default).';
COMMENT ON TABLE public.lp_landing_mot_du_president IS 'Contenu JSON du mot du président LP (singleton default).';
