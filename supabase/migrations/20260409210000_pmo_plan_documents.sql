-- PMO: step completion + per-step documents (requires existing projet_plan_items)

ALTER TABLE public.projet_plan_items
  ADD COLUMN IF NOT EXISTS pmo_step_completed boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.projet_plan_item_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_item_id uuid NOT NULL REFERENCES public.projet_plan_items(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS projet_plan_item_documents_plan_item_id_idx
  ON public.projet_plan_item_documents(plan_item_id);

ALTER TABLE public.projet_plan_item_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pmo_plan_docs_select" ON public.projet_plan_item_documents;
CREATE POLICY "pmo_plan_docs_select" ON public.projet_plan_item_documents
  FOR SELECT TO authenticated
  USING (public.is_org_admin() OR public.is_super_admin());

DROP POLICY IF EXISTS "pmo_plan_docs_insert" ON public.projet_plan_item_documents;
CREATE POLICY "pmo_plan_docs_insert" ON public.projet_plan_item_documents
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin() OR public.is_super_admin());

DROP POLICY IF EXISTS "pmo_plan_docs_delete" ON public.projet_plan_item_documents;
CREATE POLICY "pmo_plan_docs_delete" ON public.projet_plan_item_documents
  FOR DELETE TO authenticated
  USING (public.is_org_admin() OR public.is_super_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pmo-plan-documents',
  'pmo-plan-documents',
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
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "pmo_plan_storage_select" ON storage.objects;
CREATE POLICY "pmo_plan_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'pmo-plan-documents'
    AND (public.is_org_admin() OR public.is_super_admin())
  );

DROP POLICY IF EXISTS "pmo_plan_storage_insert" ON storage.objects;
CREATE POLICY "pmo_plan_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'pmo-plan-documents'
    AND (public.is_org_admin() OR public.is_super_admin())
  );

DROP POLICY IF EXISTS "pmo_plan_storage_delete" ON storage.objects;
CREATE POLICY "pmo_plan_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'pmo-plan-documents'
    AND (public.is_org_admin() OR public.is_super_admin())
  );

-- If projet_plan_items already has RLS enabled, allow admins to patch PMO fields
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'projet_plan_items'
      AND c.relrowsecurity = true
  ) THEN
    DROP POLICY IF EXISTS "projet_plan_items_update_admins" ON public.projet_plan_items;
    CREATE POLICY "projet_plan_items_update_admins" ON public.projet_plan_items
      FOR UPDATE TO authenticated
      USING (public.is_org_admin() OR public.is_super_admin())
      WITH CHECK (public.is_org_admin() OR public.is_super_admin());
  END IF;
END $$;
