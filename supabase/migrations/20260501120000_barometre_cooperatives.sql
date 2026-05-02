-- Baromètre: bucket pour photos des coopératives + colonnes carte (étend la table existante).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barometre_cooperative_images',
  'barometre_cooperative_images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "barometre_coop_img_select" ON storage.objects;
CREATE POLICY "barometre_coop_img_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'barometre_cooperative_images');

DROP POLICY IF EXISTS "barometre_coop_img_insert" ON storage.objects;
CREATE POLICY "barometre_coop_img_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'barometre_cooperative_images'
    AND (public.is_super_admin() OR public.is_org_admin())
  );

DROP POLICY IF EXISTS "barometre_coop_img_update" ON storage.objects;
CREATE POLICY "barometre_coop_img_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'barometre_cooperative_images'
    AND (public.is_super_admin() OR public.is_org_admin())
  )
  WITH CHECK (
    bucket_id = 'barometre_cooperative_images'
    AND (public.is_super_admin() OR public.is_org_admin())
  );

DROP POLICY IF EXISTS "barometre_coop_img_delete" ON storage.objects;
CREATE POLICY "barometre_coop_img_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'barometre_cooperative_images'
    AND (public.is_super_admin() OR public.is_org_admin())
  );

ALTER TABLE public.barometre_cooperatives
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS activite text,
  ADD COLUMN IF NOT EXISTS links jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS province_id text,
  ADD COLUMN IF NOT EXISTS commune_id text,
  ADD COLUMN IF NOT EXISTS province_name text,
  ADD COLUMN IF NOT EXISTS commune_name text;

UPDATE public.barometre_cooperatives SET activite = secteur_activite WHERE activite IS NULL AND secteur_activite IS NOT NULL;

UPDATE public.barometre_cooperatives SET links = liens WHERE liens IS NOT NULL;

UPDATE public.barometre_cooperatives SET province_name = province WHERE province_name IS NULL AND province IS NOT NULL;

UPDATE public.barometre_cooperatives SET commune_name = commune WHERE commune_name IS NULL AND commune IS NOT NULL;

DROP TRIGGER IF EXISTS barometre_cooperatives_touch_updated ON public.barometre_cooperatives;
CREATE TRIGGER barometre_cooperatives_touch_updated
  BEFORE UPDATE ON public.barometre_cooperatives
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

CREATE INDEX IF NOT EXISTS barometre_cooperatives_commune_id_idx
  ON public.barometre_cooperatives (commune_id);

CREATE INDEX IF NOT EXISTS barometre_cooperatives_lat_lng_idx
  ON public.barometre_cooperatives (latitude, longitude);

COMMENT ON TABLE public.barometre_cooperatives IS 'Coopératives baromètre territorial (admin). Colonnes historiques: secteur_activite, liens, province, commune.';
