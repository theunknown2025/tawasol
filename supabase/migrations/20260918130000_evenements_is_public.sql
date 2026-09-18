-- Public visibility for landing page vs Tawasol-only events

ALTER TABLE public.evenements
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.evenements.is_public IS
  'Si true: landing + /events + Tawasol. Si false: Tawasol uniquement (pas landing ni /events).';

-- Existing rows already get true via DEFAULT; keep explicit for clarity
UPDATE public.evenements
SET is_public = true
WHERE is_public IS DISTINCT FROM true;
