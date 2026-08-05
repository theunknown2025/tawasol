-- Coordonnées générales complémentaires + évaluation coopérative (baromètre).

ALTER TABLE public.barometre_cooperatives
  ADD COLUMN IF NOT EXISTS secteur text,
  ADD COLUMN IF NOT EXISTS sous_secteur text,
  ADD COLUMN IF NOT EXISTS temps_de_travail text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS evaluation jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.barometre_cooperatives.secteur IS
  'Secteur (coordonnées générales), distinct de activite / secteur_activite.';
COMMENT ON COLUMN public.barometre_cooperatives.sous_secteur IS
  'Sous-secteur de la coopérative.';
COMMENT ON COLUMN public.barometre_cooperatives.temps_de_travail IS
  'Temps de travail (ex. temps plein, partiel, saisonnier).';
COMMENT ON COLUMN public.barometre_cooperatives.facebook_url IS
  'URL ou identifiant Facebook.';
COMMENT ON COLUMN public.barometre_cooperatives.instagram_url IS
  'URL ou identifiant Instagram.';
COMMENT ON COLUMN public.barometre_cooperatives.evaluation IS
  'Scores d''évaluation (1–5) : gouvernance, conditions_travail, developpement_personnel, transparence, ancrage_territorial, intercooperation, performance_economique, communication_externe, approche_genre, durabilite_environnementale, innovation.';
