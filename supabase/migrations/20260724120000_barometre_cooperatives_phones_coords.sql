-- Cartographie: multi-téléphones (max 3) + commentaire de coordonnées X/Y (longitude/latitude).

ALTER TABLE public.barometre_cooperatives
  ADD COLUMN IF NOT EXISTS phones jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Backfill depuis l'ancien champ tel
UPDATE public.barometre_cooperatives
SET phones = jsonb_build_array(trim(tel))
WHERE (phones IS NULL OR phones = '[]'::jsonb)
  AND tel IS NOT NULL
  AND trim(tel) <> '';

COMMENT ON COLUMN public.barometre_cooperatives.phones IS
  'Liste de numéros de téléphone (max 3). Le premier est aussi synchronisé dans tel.';

COMMENT ON COLUMN public.barometre_cooperatives.longitude IS
  'Coordonnée X (longitude WGS84). Si renseignée avec latitude, prioritaire pour le marqueur carte.';

COMMENT ON COLUMN public.barometre_cooperatives.latitude IS
  'Coordonnée Y (latitude WGS84). Si renseignée avec longitude, prioritaire pour le marqueur carte.';
