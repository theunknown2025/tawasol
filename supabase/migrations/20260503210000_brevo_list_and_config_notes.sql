-- Listes Brevo par canal ; notes config (remplace la référence URL WAHA)

ALTER TABLE public.whatsapp_groups ADD COLUMN IF NOT EXISTS brevo_list_id integer;
COMMENT ON COLUMN public.whatsapp_groups.brevo_list_id IS 'ID de liste Brevo (Contacts > Listes) pour les campagnes email.';

ALTER TABLE public.waha_integration_config ADD COLUMN IF NOT EXISTS brevo_notes text NOT NULL DEFAULT '';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waha_integration_config'
      AND column_name = 'waha_server_url_note'
  ) THEN
    UPDATE public.waha_integration_config
    SET brevo_notes = waha_server_url_note
    WHERE brevo_notes = '' AND NULLIF(TRIM(waha_server_url_note), '') IS NOT NULL;
    ALTER TABLE public.waha_integration_config DROP COLUMN waha_server_url_note;
  END IF;
END $$;

COMMENT ON COLUMN public.waha_integration_config.brevo_notes IS 'Notes Brevo (expéditeur, listes, etc.) — pas de clé API ici.';
