-- Chart visual style (background, axis fonts, series colors, tooltip) per baromètre dataset.

ALTER TABLE public.barometre_datasets
  ADD COLUMN IF NOT EXISTS chart_style jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.barometre_datasets.chart_style IS
  'Baromètre chart appearance: background, axis fonts, series colors, tooltip, universal flag.';
