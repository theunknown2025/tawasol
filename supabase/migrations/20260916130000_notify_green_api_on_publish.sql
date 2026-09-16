-- Fire Green API WhatsApp notify alongside SMTP on publish
-- (publications, evenements, blogs, lp_opportunities — projets stay email-only)

CREATE OR REPLACE FUNCTION public.invoke_notify_smtp_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
  headers jsonb;
  smtp_url text := 'https://usbdedrhhrxuyfqnwbls.supabase.co/functions/v1/notify-smtp-published';
  wa_url text := 'https://usbdedrhhrxuyfqnwbls.supabase.co/functions/v1/notify-green-api-published';
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

  -- Email (SMTP)
  PERFORM net.http_post(
    url := smtp_url,
    headers := headers,
    body := payload
  );

  -- WhatsApp (Green API) — events, blogs, publications, opportunities
  IF TG_TABLE_NAME IN ('publications', 'evenements', 'blogs', 'lp_opportunities') THEN
    PERFORM net.http_post(
      url := wa_url,
      headers := headers,
      body := payload
    );
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.invoke_notify_smtp_published() IS
  'Appelle notify-smtp-published (email) et notify-green-api-published (WhatsApp) à chaque passage en status published.';
