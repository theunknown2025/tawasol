-- Profiles: account activation (super admin)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  );
$$;

DO $$ BEGIN
  CREATE TYPE public.admin_doc_category AS ENUM (
    'liste_membre',
    'assemblee_generale',
    'bilan_activite',
    'bilan_financier',
    'autre'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.admin_organization_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  organization_name text,
  contact_email text,
  contact_phone text,
  contact_address text,
  description text,
  rep_full_name text,
  rep_fonction text,
  rep_email text,
  rep_phone text,
  statut_liste_membre boolean NOT NULL DEFAULT false,
  statut_assemblee_generale boolean NOT NULL DEFAULT false,
  statut_bilan_activite boolean NOT NULL DEFAULT false,
  statut_bilan_financier boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_profile_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  label text,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_profile_links_user_id_idx ON public.admin_profile_links(user_id);

CREATE TABLE IF NOT EXISTS public.admin_legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  category public.admin_doc_category NOT NULL DEFAULT 'autre',
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_legal_documents_user_id_idx ON public.admin_legal_documents(user_id);

CREATE OR REPLACE FUNCTION public.touch_admin_organization_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_org_profiles_updated ON public.admin_organization_profiles;
CREATE TRIGGER trg_admin_org_profiles_updated
  BEFORE UPDATE ON public.admin_organization_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_admin_organization_profiles_updated_at();

ALTER TABLE public.admin_organization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profile_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_legal_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_org_select" ON public.admin_organization_profiles;
CREATE POLICY "admin_org_select" ON public.admin_organization_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "admin_org_insert" ON public.admin_organization_profiles;
CREATE POLICY "admin_org_insert" ON public.admin_organization_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_org_admin());

DROP POLICY IF EXISTS "admin_org_update" ON public.admin_organization_profiles;
CREATE POLICY "admin_org_update" ON public.admin_organization_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_org_admin() OR public.is_super_admin())
  WITH CHECK (user_id = auth.uid() AND public.is_org_admin() OR public.is_super_admin());

DROP POLICY IF EXISTS "admin_links_select" ON public.admin_profile_links;
CREATE POLICY "admin_links_select" ON public.admin_profile_links
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "admin_links_insert" ON public.admin_profile_links;
CREATE POLICY "admin_links_insert" ON public.admin_profile_links
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_org_admin());

DROP POLICY IF EXISTS "admin_links_update" ON public.admin_profile_links;
CREATE POLICY "admin_links_update" ON public.admin_profile_links
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_org_admin() OR public.is_super_admin())
  WITH CHECK (user_id = auth.uid() AND public.is_org_admin() OR public.is_super_admin());

DROP POLICY IF EXISTS "admin_links_delete" ON public.admin_profile_links;
CREATE POLICY "admin_links_delete" ON public.admin_profile_links
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.is_org_admin() OR public.is_super_admin());

DROP POLICY IF EXISTS "admin_docs_select" ON public.admin_legal_documents;
CREATE POLICY "admin_docs_select" ON public.admin_legal_documents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "admin_docs_insert" ON public.admin_legal_documents;
CREATE POLICY "admin_docs_insert" ON public.admin_legal_documents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_org_admin());

DROP POLICY IF EXISTS "admin_docs_delete" ON public.admin_legal_documents;
CREATE POLICY "admin_docs_delete" ON public.admin_legal_documents
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.is_org_admin() OR public.is_super_admin());

CREATE OR REPLACE FUNCTION public.admin_set_profile_active(p_user_id uuid, p_is_active boolean)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
  updated_row public.profiles;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role <> 'super_admin' THEN
    RAISE EXCEPTION 'Forbidden: Super Admin only';
  END IF;
  UPDATE public.profiles
  SET is_active = p_is_active, updated_at = now()
  WHERE user_id = p_user_id
  RETURNING * INTO updated_row;
  IF updated_row.user_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  RETURN updated_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_profile_active(uuid, boolean) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admin-documents',
  'admin-documents',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "admin_documents_select" ON storage.objects;
CREATE POLICY "admin_documents_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'admin-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_super_admin()
    )
  );

DROP POLICY IF EXISTS "admin_documents_insert" ON storage.objects;
CREATE POLICY "admin_documents_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'admin-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.is_org_admin()
  );

DROP POLICY IF EXISTS "admin_documents_delete" ON storage.objects;
CREATE POLICY "admin_documents_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'admin-documents'
    AND (
      (
        (storage.foldername(name))[1] = auth.uid()::text
        AND public.is_org_admin()
      )
      OR public.is_super_admin()
    )
  );
