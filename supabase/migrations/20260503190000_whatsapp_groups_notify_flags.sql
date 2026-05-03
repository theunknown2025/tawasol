-- Préférences d’envoi WAHA par groupe et par type de contenu

ALTER TABLE public.whatsapp_groups
  ADD COLUMN IF NOT EXISTS notify_publications boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_events boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_blogs boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.whatsapp_groups.notify_publications IS 'Si true, notifier ce groupe lors d’une publication « Mur » publiée.';
COMMENT ON COLUMN public.whatsapp_groups.notify_events IS 'Si true, notifier ce groupe lors de la publication d’un événement.';
COMMENT ON COLUMN public.whatsapp_groups.notify_blogs IS 'Si true, notifier ce groupe lors de la publication d’un article de blog.';
