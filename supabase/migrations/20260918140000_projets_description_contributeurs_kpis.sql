-- Enrich admin projets: description metadata, plan contributeurs, KPIs, complementary docs

ALTER TABLE public.projets
  ADD COLUMN IF NOT EXISTS zone_region text,
  ADD COLUMN IF NOT EXISTS zone_province text,
  ADD COLUMN IF NOT EXISTS budget numeric,
  ADD COLUMN IF NOT EXISTS date_debut date,
  ADD COLUMN IF NOT EXISTS date_fin date;

COMMENT ON COLUMN public.projets.zone_region IS 'Zone d''intervention - région';
COMMENT ON COLUMN public.projets.zone_province IS 'Zone d''intervention - province';
COMMENT ON COLUMN public.projets.budget IS 'Budget du projet (optionnel)';
COMMENT ON COLUMN public.projets.date_debut IS 'Durée du projet - date de début';
COMMENT ON COLUMN public.projets.date_fin IS 'Durée du projet - date de fin';

ALTER TABLE public.projet_plan_items
  ADD COLUMN IF NOT EXISTS contributeur_ids uuid[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.projet_plan_items.contributeur_ids IS 'Personnel contributeurs (hors responsable)';

CREATE TABLE IF NOT EXISTS public.projet_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projet_id uuid NOT NULL REFERENCES public.projets(id) ON DELETE CASCADE,
  nom text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  objectif text NOT NULL DEFAULT '',
  resultat_escompte text NOT NULL DEFAULT '',
  mesure text NOT NULL DEFAULT '',
  frequence text NOT NULL DEFAULT '',
  ordre int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projet_kpis_projet_id_idx ON public.projet_kpis(projet_id);

ALTER TABLE public.projet_kpis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projet_kpis_select" ON public.projet_kpis;
CREATE POLICY "projet_kpis_select" ON public.projet_kpis
  FOR SELECT TO authenticated
  USING (public.is_org_admin() OR public.is_super_admin());

DROP POLICY IF EXISTS "projet_kpis_insert" ON public.projet_kpis;
CREATE POLICY "projet_kpis_insert" ON public.projet_kpis
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin() OR public.is_super_admin());

DROP POLICY IF EXISTS "projet_kpis_update" ON public.projet_kpis;
CREATE POLICY "projet_kpis_update" ON public.projet_kpis
  FOR UPDATE TO authenticated
  USING (public.is_org_admin() OR public.is_super_admin())
  WITH CHECK (public.is_org_admin() OR public.is_super_admin());

DROP POLICY IF EXISTS "projet_kpis_delete" ON public.projet_kpis;
CREATE POLICY "projet_kpis_delete" ON public.projet_kpis
  FOR DELETE TO authenticated
  USING (public.is_org_admin() OR public.is_super_admin());

CREATE TABLE IF NOT EXISTS public.projet_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projet_id uuid NOT NULL REFERENCES public.projets(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS projet_documents_projet_id_idx ON public.projet_documents(projet_id);

ALTER TABLE public.projet_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projet_docs_select" ON public.projet_documents;
CREATE POLICY "projet_docs_select" ON public.projet_documents
  FOR SELECT TO authenticated
  USING (public.is_org_admin() OR public.is_super_admin());

DROP POLICY IF EXISTS "projet_docs_insert" ON public.projet_documents;
CREATE POLICY "projet_docs_insert" ON public.projet_documents
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin() OR public.is_super_admin());

DROP POLICY IF EXISTS "projet_docs_delete" ON public.projet_documents;
CREATE POLICY "projet_docs_delete" ON public.projet_documents
  FOR DELETE TO authenticated
  USING (public.is_org_admin() OR public.is_super_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'projet-documents',
  'projet-documents',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "projet_docs_storage_select" ON storage.objects;
CREATE POLICY "projet_docs_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'projet-documents'
    AND (public.is_org_admin() OR public.is_super_admin())
  );

DROP POLICY IF EXISTS "projet_docs_storage_insert" ON storage.objects;
CREATE POLICY "projet_docs_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'projet-documents'
    AND (public.is_org_admin() OR public.is_super_admin())
  );

DROP POLICY IF EXISTS "projet_docs_storage_delete" ON storage.objects;
CREATE POLICY "projet_docs_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'projet-documents'
    AND (public.is_org_admin() OR public.is_super_admin())
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projet_kpis TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.projet_documents TO authenticated;
