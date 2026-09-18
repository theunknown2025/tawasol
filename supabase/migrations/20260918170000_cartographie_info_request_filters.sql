-- Filtres (activité / province / commune) + commentaire super-admin sur les demandes cartographie.

ALTER TABLE public.cartographie_info_requests
  ADD COLUMN IF NOT EXISTS filter_activities text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS filter_provinces text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS filter_communes text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS admin_comment text;

COMMENT ON COLUMN public.cartographie_info_requests.filter_activities IS
  'Secteurs d''activité sélectionnés (multi) pour filtrer l''export Excel.';
COMMENT ON COLUMN public.cartographie_info_requests.filter_provinces IS
  'Provinces sélectionnées (multi, noms) pour filtrer l''export Excel.';
COMMENT ON COLUMN public.cartographie_info_requests.filter_communes IS
  'Communes sélectionnées (multi, noms) pour filtrer l''export Excel.';
COMMENT ON COLUMN public.cartographie_info_requests.admin_comment IS
  'Commentaire du super admin inclus dans l''e-mail d''approbation.';
