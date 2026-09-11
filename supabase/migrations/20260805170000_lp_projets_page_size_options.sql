-- Projects public page: allow 6 / 18 / 36 items per page (was 5 / 15 / 50).

ALTER TABLE public.lp_projets_public_settings
  DROP CONSTRAINT IF EXISTS lp_projets_public_settings_page_size_check;

UPDATE public.lp_projets_public_settings
SET page_size = CASE page_size
  WHEN 5 THEN 6
  WHEN 15 THEN 18
  WHEN 50 THEN 36
  ELSE 18
END
WHERE page_size NOT IN (6, 18, 36);

ALTER TABLE public.lp_projets_public_settings
  ALTER COLUMN page_size SET DEFAULT 18;

ALTER TABLE public.lp_projets_public_settings
  ADD CONSTRAINT lp_projets_public_settings_page_size_check
  CHECK (page_size IN (6, 18, 36));
