-- Paramètres d’intégration WAHA (référence admin — secrets réels restent dans Edge Function secrets)

CREATE TABLE IF NOT EXISTS public.waha_integration_config (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  public_site_url text NOT NULL DEFAULT '',
  waha_server_url_note text NOT NULL DEFAULT '',
  internal_notes text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS waha_integration_config_touch ON public.waha_integration_config;
CREATE TRIGGER waha_integration_config_touch
  BEFORE UPDATE ON public.waha_integration_config
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

INSERT INTO public.waha_integration_config (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.waha_integration_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waha_integration_config_select" ON public.waha_integration_config;
CREATE POLICY "waha_integration_config_select" ON public.waha_integration_config
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "waha_integration_config_update" ON public.waha_integration_config;
CREATE POLICY "waha_integration_config_update" ON public.waha_integration_config
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "waha_integration_config_insert" ON public.waha_integration_config;
CREATE POLICY "waha_integration_config_insert" ON public.waha_integration_config
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

COMMENT ON TABLE public.waha_integration_config IS 'Notes et URLs de référence pour WAHA (super admin). Les clés secrètes restent dans les secrets Edge Function.';
