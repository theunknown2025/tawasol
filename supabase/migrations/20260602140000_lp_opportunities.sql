-- Opportunities manager: listings, applications, storage, public settings

CREATE TABLE IF NOT EXISTS public.lp_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  opportunity_type text NOT NULL CHECK (
    opportunity_type IN ('emploi', 'stage', 'ami', 'tdr', 'formation')
  ),
  format text NOT NULL CHECK (
    format IN ('presentiel', 'distance', 'hybride')
  ),
  salary_mad numeric,
  deadline date NOT NULL,
  location text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  banner jsonb NOT NULL DEFAULT '{"type":"solid","color":"#4f46e5"}'::jsonb,
  registration_form_id uuid REFERENCES public.admin_gestion_forms (id) ON DELETE SET NULL,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  public_slug text UNIQUE,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lp_opportunities_status_idx ON public.lp_opportunities (status);
CREATE INDEX IF NOT EXISTS lp_opportunities_created_by_idx ON public.lp_opportunities (created_by);
CREATE INDEX IF NOT EXISTS lp_opportunities_published_at_idx ON public.lp_opportunities (published_at DESC NULLS LAST);

UPDATE public.lp_opportunities
SET public_slug = encode(gen_random_bytes(9), 'hex')
WHERE public_slug IS NULL;

ALTER TABLE public.lp_opportunities
  ALTER COLUMN public_slug SET DEFAULT encode(gen_random_bytes(9), 'hex');

CREATE TABLE IF NOT EXISTS public.lp_opportunity_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.lp_opportunities (id) ON DELETE CASCADE,
  applicant_name text NOT NULL DEFAULT '',
  applicant_email text NOT NULL DEFAULT '',
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  file_uploads jsonb NOT NULL DEFAULT '{}'::jsonb,
  decision text NOT NULL DEFAULT 'pending' CHECK (
    decision IN ('pending', 'accepte', 'sous_reserve', 'rejete')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lp_opportunity_applications_opportunity_id_idx
  ON public.lp_opportunity_applications (opportunity_id);

CREATE INDEX IF NOT EXISTS lp_opportunity_applications_decision_idx
  ON public.lp_opportunity_applications (decision);

CREATE TABLE IF NOT EXISTS public.lp_opportunities_public_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  display_mode text NOT NULL DEFAULT 'card' CHECK (display_mode IN ('card', 'rows')),
  page_size int NOT NULL DEFAULT 15 CHECK (page_size IN (5, 15, 50)),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.lp_opportunities_public_settings (id, display_mode, page_size)
VALUES (1, 'card', 15)
ON CONFLICT (id) DO NOTHING;

-- Triggers
CREATE OR REPLACE FUNCTION public.lp_opportunities_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.public_slug IS NULL OR NEW.public_slug = '' THEN
    NEW.public_slug = encode(gen_random_bytes(9), 'hex');
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
      NEW.published_at = now();
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published' THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lp_opportunities_set_updated_at ON public.lp_opportunities;
CREATE TRIGGER lp_opportunities_set_updated_at
  BEFORE INSERT OR UPDATE ON public.lp_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.lp_opportunities_set_updated_at();

CREATE OR REPLACE FUNCTION public.lp_opportunity_applications_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lp_opportunity_applications_set_updated_at ON public.lp_opportunity_applications;
CREATE TRIGGER lp_opportunity_applications_set_updated_at
  BEFORE UPDATE ON public.lp_opportunity_applications
  FOR EACH ROW EXECUTE FUNCTION public.lp_opportunity_applications_set_updated_at();

-- RLS
ALTER TABLE public.lp_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lp_opportunity_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lp_opportunities_public_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_opportunities_select_published_anon" ON public.lp_opportunities;
CREATE POLICY "lp_opportunities_select_published_anon" ON public.lp_opportunities
  FOR SELECT TO anon
  USING (status = 'published');

DROP POLICY IF EXISTS "lp_opportunities_select_auth" ON public.lp_opportunities;
CREATE POLICY "lp_opportunities_select_auth" ON public.lp_opportunities
  FOR SELECT TO authenticated
  USING (
    status = 'published'
    OR created_by = auth.uid()
    OR public.is_super_admin()
    OR public.is_org_admin()
  );

DROP POLICY IF EXISTS "lp_opportunities_insert" ON public.lp_opportunities;
CREATE POLICY "lp_opportunities_insert" ON public.lp_opportunities
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (public.is_super_admin() OR public.is_org_admin())
  );

DROP POLICY IF EXISTS "lp_opportunities_update" ON public.lp_opportunities;
CREATE POLICY "lp_opportunities_update" ON public.lp_opportunities
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    AND (public.is_super_admin() OR public.is_org_admin())
  )
  WITH CHECK (
    created_by = auth.uid()
    AND (public.is_super_admin() OR public.is_org_admin())
  );

DROP POLICY IF EXISTS "lp_opportunities_delete" ON public.lp_opportunities;
CREATE POLICY "lp_opportunities_delete" ON public.lp_opportunities
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    AND (public.is_super_admin() OR public.is_org_admin())
  );

DROP POLICY IF EXISTS "lp_opportunity_applications_insert_public" ON public.lp_opportunity_applications;
CREATE POLICY "lp_opportunity_applications_insert_public" ON public.lp_opportunity_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lp_opportunities o
      WHERE o.id = opportunity_id
        AND o.status = 'published'
        AND o.registration_form_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "lp_opportunity_applications_select_admin" ON public.lp_opportunity_applications;
CREATE POLICY "lp_opportunity_applications_select_admin" ON public.lp_opportunity_applications
  FOR SELECT TO authenticated
  USING (public.is_super_admin() OR public.is_org_admin());

DROP POLICY IF EXISTS "lp_opportunity_applications_update_admin" ON public.lp_opportunity_applications;
CREATE POLICY "lp_opportunity_applications_update_admin" ON public.lp_opportunity_applications
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR public.is_org_admin())
  WITH CHECK (public.is_super_admin() OR public.is_org_admin());

DROP POLICY IF EXISTS "lp_opportunities_public_settings_select" ON public.lp_opportunities_public_settings;
CREATE POLICY "lp_opportunities_public_settings_select" ON public.lp_opportunities_public_settings
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "lp_opportunities_public_settings_manage" ON public.lp_opportunities_public_settings;
CREATE POLICY "lp_opportunities_public_settings_manage" ON public.lp_opportunities_public_settings
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

GRANT SELECT ON public.lp_opportunities TO anon;
GRANT SELECT ON public.lp_opportunities_public_settings TO anon;
GRANT INSERT ON public.lp_opportunity_applications TO anon;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'opportunities-banners',
  'opportunities-banners',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'opportunities-documents',
  'opportunities-documents',
  true,
  20971520
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'opportunity-application-files',
  'opportunity-application-files',
  false,
  20971520
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- opportunities-banners
DROP POLICY IF EXISTS "opportunities_banners_select_public" ON storage.objects;
CREATE POLICY "opportunities_banners_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'opportunities-banners');

DROP POLICY IF EXISTS "opportunities_banners_insert_admin" ON storage.objects;
CREATE POLICY "opportunities_banners_insert_admin" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'opportunities-banners'
    AND (public.is_super_admin() OR public.is_org_admin())
  );

DROP POLICY IF EXISTS "opportunities_banners_update_admin" ON storage.objects;
CREATE POLICY "opportunities_banners_update_admin" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'opportunities-banners'
    AND (public.is_super_admin() OR public.is_org_admin())
  );

DROP POLICY IF EXISTS "opportunities_banners_delete_admin" ON storage.objects;
CREATE POLICY "opportunities_banners_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'opportunities-banners'
    AND (public.is_super_admin() OR public.is_org_admin())
  );

-- opportunities-documents
DROP POLICY IF EXISTS "opportunities_documents_select_public" ON storage.objects;
CREATE POLICY "opportunities_documents_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'opportunities-documents');

DROP POLICY IF EXISTS "opportunities_documents_insert_admin" ON storage.objects;
CREATE POLICY "opportunities_documents_insert_admin" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'opportunities-documents'
    AND (public.is_super_admin() OR public.is_org_admin())
  );

DROP POLICY IF EXISTS "opportunities_documents_delete_admin" ON storage.objects;
CREATE POLICY "opportunities_documents_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'opportunities-documents'
    AND (public.is_super_admin() OR public.is_org_admin())
  );

-- opportunity-application-files (public upload, admin read)
DROP POLICY IF EXISTS "opportunity_app_files_insert_public" ON storage.objects;
CREATE POLICY "opportunity_app_files_insert_public" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'opportunity-application-files');

DROP POLICY IF EXISTS "opportunity_app_files_select_admin" ON storage.objects;
CREATE POLICY "opportunity_app_files_select_admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'opportunity-application-files'
    AND (public.is_super_admin() OR public.is_org_admin())
  );

DROP POLICY IF EXISTS "opportunity_app_files_delete_admin" ON storage.objects;
CREATE POLICY "opportunity_app_files_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'opportunity-application-files'
    AND (public.is_super_admin() OR public.is_org_admin())
  );
