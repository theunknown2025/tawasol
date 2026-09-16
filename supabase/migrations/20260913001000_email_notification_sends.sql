-- Historique des emails de notification envoyés avec succès

CREATE TABLE IF NOT EXISTS public.email_notification_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid REFERENCES public.publications (id) ON DELETE SET NULL,
  group_id uuid REFERENCES public.email_notification_groups (id) ON DELETE SET NULL,
  group_name text NOT NULL DEFAULT '',
  recipient_name text NOT NULL DEFAULT '',
  recipient_email text NOT NULL,
  author_name text NOT NULL DEFAULT '',
  content_excerpt text NOT NULL DEFAULT '',
  publication_link text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_notification_sends_sent_at_idx
  ON public.email_notification_sends (sent_at DESC);

CREATE INDEX IF NOT EXISTS email_notification_sends_publication_id_idx
  ON public.email_notification_sends (publication_id);

ALTER TABLE public.email_notification_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_notification_sends_select" ON public.email_notification_sends;
CREATE POLICY "email_notification_sends_select" ON public.email_notification_sends
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

COMMENT ON TABLE public.email_notification_sends IS 'Historique des emails de publication envoyés avec succès (SMTP).';
