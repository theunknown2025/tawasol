-- Président(e), visibilité publique, lecture anonyme sécurisée (carte publique).

ALTER TABLE public.barometre_cooperatives
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS president_genre text,
  ADD COLUMN IF NOT EXISTS president_nom_complet text,
  ADD COLUMN IF NOT EXISTS president_email text,
  ADD COLUMN IF NOT EXISTS president_tel text;

ALTER TABLE public.barometre_cooperatives
  DROP CONSTRAINT IF EXISTS barometre_cooperatives_president_genre_check;

ALTER TABLE public.barometre_cooperatives
  ADD CONSTRAINT barometre_cooperatives_president_genre_check
  CHECK (president_genre IS NULL OR president_genre IN ('male', 'female'));

COMMENT ON COLUMN public.barometre_cooperatives.is_published IS 'Si true, la ligne est lisible par anon (carte publique).';
COMMENT ON COLUMN public.barometre_cooperatives.president_genre IS 'male | female';

-- Lecture publique : uniquement les fiches publiées (pas d’écriture anon).
DROP POLICY IF EXISTS "barometre_cooperatives_select_anon_public" ON public.barometre_cooperatives;
CREATE POLICY "barometre_cooperatives_select_anon_public" ON public.barometre_cooperatives
  FOR SELECT TO anon
  USING (is_published = true);

-- Utilisateurs connectés non-admin : même périmètre que l’anon (carte publique).
DROP POLICY IF EXISTS "barometre_cooperatives_select_authenticated_public" ON public.barometre_cooperatives;
CREATE POLICY "barometre_cooperatives_select_authenticated_public" ON public.barometre_cooperatives
  FOR SELECT TO authenticated
  USING (is_published = true);

-- Bucket : lecture déjà publique ; écriture réservée aux admins (inchangé).
