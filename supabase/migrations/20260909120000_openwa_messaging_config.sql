-- OpenWA: one WhatsApp group for super-admin messaging (invite link + resolved JID)

CREATE TABLE IF NOT EXISTS public.openwa_messaging_config (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  group_name text NOT NULL DEFAULT '',
  group_invite_link text NOT NULL DEFAULT '',
  group_jid text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS openwa_messaging_config_touch ON public.openwa_messaging_config;
CREATE TRIGGER openwa_messaging_config_touch
  BEFORE UPDATE ON public.openwa_messaging_config
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

INSERT INTO public.openwa_messaging_config (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.openwa_messaging_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "openwa_messaging_config_select" ON public.openwa_messaging_config;
CREATE POLICY "openwa_messaging_config_select" ON public.openwa_messaging_config
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "openwa_messaging_config_update" ON public.openwa_messaging_config;
CREATE POLICY "openwa_messaging_config_update" ON public.openwa_messaging_config
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "openwa_messaging_config_insert" ON public.openwa_messaging_config;
CREATE POLICY "openwa_messaging_config_insert" ON public.openwa_messaging_config
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

COMMENT ON TABLE public.openwa_messaging_config IS
  'Groupe WhatsApp cible pour OpenWA (lien d’invitation + JID). Secrets OpenWA dans Edge Function.';
