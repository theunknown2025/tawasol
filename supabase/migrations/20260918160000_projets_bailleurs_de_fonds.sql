-- Bailleurs de fonds on admin projets

ALTER TABLE public.projets
  ADD COLUMN IF NOT EXISTS bailleurs_de_fonds text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.projets.bailleurs_de_fonds IS 'Liste des bailleurs de fonds du projet';
