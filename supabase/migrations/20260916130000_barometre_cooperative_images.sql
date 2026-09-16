-- Multiple cooperative images (max 5): main + complementary.
-- image_url remains the main image URL for backward compatibility.

ALTER TABLE public.barometre_cooperatives
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.barometre_cooperatives.images IS
  'Galerie images: [{ "url": string, "is_main": boolean }], max 5. image_url mirrors the main.';

-- Backfill from legacy single image_url.
UPDATE public.barometre_cooperatives
SET images = jsonb_build_array(
  jsonb_build_object('url', image_url, 'is_main', true)
)
WHERE image_url IS NOT NULL
  AND trim(image_url) <> ''
  AND (
    images IS NULL
    OR images = '[]'::jsonb
    OR jsonb_typeof(images) <> 'array'
    OR jsonb_array_length(images) = 0
  );
