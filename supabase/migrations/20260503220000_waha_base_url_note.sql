-- Référence URL serveur WAHA (admin) — secret réel : WAHA_BASE_URL dans Edge Function

ALTER TABLE public.waha_integration_config ADD COLUMN IF NOT EXISTS waha_base_url_note text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.waha_integration_config.waha_base_url_note IS 'URL de référence du serveur WAHA (aligner sur le secret WAHA_BASE_URL).';
