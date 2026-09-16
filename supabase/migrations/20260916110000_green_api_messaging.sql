-- Green API WhatsApp messaging: config (one group) + send/notification history

CREATE TABLE IF NOT EXISTS public.green_api_messaging_config (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  instance_id text NOT NULL DEFAULT '',
  api_token text NOT NULL DEFAULT '',
  api_url text NOT NULL DEFAULT 'https://api.green-api.com',
  group_name text NOT NULL DEFAULT '',
  group_chat_id text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS green_api_messaging_config_touch ON public.green_api_messaging_config;
CREATE TRIGGER green_api_messaging_config_touch
  BEFORE UPDATE ON public.green_api_messaging_config
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

INSERT INTO public.green_api_messaging_config (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.green_api_messaging_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "green_api_messaging_config_select" ON public.green_api_messaging_config;
CREATE POLICY "green_api_messaging_config_select" ON public.green_api_messaging_config
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "green_api_messaging_config_update" ON public.green_api_messaging_config;
CREATE POLICY "green_api_messaging_config_update" ON public.green_api_messaging_config
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "green_api_messaging_config_insert" ON public.green_api_messaging_config;
CREATE POLICY "green_api_messaging_config_insert" ON public.green_api_messaging_config
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

COMMENT ON TABLE public.green_api_messaging_config IS
  'Green API instance + groupe WhatsApp cible (super admin).';

CREATE TABLE IF NOT EXISTS public.green_api_message_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'notification')),
  content_type text,
  content_id uuid,
  content_title text NOT NULL DEFAULT '',
  group_name text NOT NULL DEFAULT '',
  group_chat_id text NOT NULL DEFAULT '',
  message_text text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'failed')),
  green_message_id text,
  error_message text,
  sent_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS green_api_message_sends_sent_at_idx
  ON public.green_api_message_sends (sent_at DESC);

ALTER TABLE public.green_api_message_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "green_api_message_sends_select" ON public.green_api_message_sends;
CREATE POLICY "green_api_message_sends_select" ON public.green_api_message_sends
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "green_api_message_sends_insert" ON public.green_api_message_sends;
CREATE POLICY "green_api_message_sends_insert" ON public.green_api_message_sends
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

COMMENT ON TABLE public.green_api_message_sends IS
  'Historique des messages / notifications WhatsApp envoyés via Green API.';
