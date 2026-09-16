-- Extend notify triggers to projets + opportunités
-- Broaden email history for all content types

ALTER TABLE public.email_notification_sends
  ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'publication',
  ADD COLUMN IF NOT EXISTS content_id uuid,
  ADD COLUMN IF NOT EXISTS content_title text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.email_notification_sends.content_type IS
  'publication | event | project | opportunity';

CREATE OR REPLACE FUNCTION public.invoke_notify_brevo_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
  headers jsonb;
  edge_url text := 'https://usbdedrhhrxuyfqnwbls.supabase.co/functions/v1/notify-brevo-published';
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  IF NEW.status IS DISTINCT FROM 'published' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'published' THEN
    RETURN NEW;
  END IF;

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', to_jsonb(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END
  );

  headers := jsonb_build_object('Content-Type', 'application/json');

  PERFORM net.http_post(
    url := edge_url,
    headers := headers,
    body := payload
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.invoke_notify_brevo_published() IS
  'Appelle notify-brevo-published (SMTP Postfix) à chaque passage en status published.';

DROP TRIGGER IF EXISTS lp_projets_notify_brevo_published ON public.lp_projets;
CREATE TRIGGER lp_projets_notify_brevo_published
  AFTER INSERT OR UPDATE ON public.lp_projets
  FOR EACH ROW
  EXECUTE FUNCTION public.invoke_notify_brevo_published();

DROP TRIGGER IF EXISTS lp_opportunities_notify_brevo_published ON public.lp_opportunities;
CREATE TRIGGER lp_opportunities_notify_brevo_published
  AFTER INSERT OR UPDATE ON public.lp_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.invoke_notify_brevo_published();
