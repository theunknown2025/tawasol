-- Notifications publication → Edge Function notify-brevo-published (Brevo + WAHA)
-- Nécessite pg_net. Secrets WAHA/Brevo restent dans Edge Functions → Secrets.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

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
  'Appelle notify-brevo-published (email Brevo + WhatsApp WAHA) à chaque passage en status published.';

DROP TRIGGER IF EXISTS publications_notify_brevo_published ON public.publications;
CREATE TRIGGER publications_notify_brevo_published
  AFTER INSERT OR UPDATE ON public.publications
  FOR EACH ROW
  EXECUTE FUNCTION public.invoke_notify_brevo_published();

DROP TRIGGER IF EXISTS evenements_notify_brevo_published ON public.evenements;
CREATE TRIGGER evenements_notify_brevo_published
  AFTER INSERT OR UPDATE ON public.evenements
  FOR EACH ROW
  EXECUTE FUNCTION public.invoke_notify_brevo_published();

DROP TRIGGER IF EXISTS blogs_notify_brevo_published ON public.blogs;
CREATE TRIGGER blogs_notify_brevo_published
  AFTER INSERT OR UPDATE ON public.blogs
  FOR EACH ROW
  EXECUTE FUNCTION public.invoke_notify_brevo_published();
