-- Blogs (admin) + public read of published posts + storage for banner images.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog_banners',
  'blog_banners',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "blog_banners_objects_select" ON storage.objects;
CREATE POLICY "blog_banners_objects_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog_banners');

DROP POLICY IF EXISTS "blog_banners_objects_insert" ON storage.objects;
CREATE POLICY "blog_banners_objects_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'blog_banners'
    AND (public.is_super_admin() OR public.is_org_admin())
  );

DROP POLICY IF EXISTS "blog_banners_objects_update" ON storage.objects;
CREATE POLICY "blog_banners_objects_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'blog_banners'
    AND (public.is_super_admin() OR public.is_org_admin())
  )
  WITH CHECK (
    bucket_id = 'blog_banners'
    AND (public.is_super_admin() OR public.is_org_admin())
  );

DROP POLICY IF EXISTS "blog_banners_objects_delete" ON storage.objects;
CREATE POLICY "blog_banners_objects_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'blog_banners'
    AND (public.is_super_admin() OR public.is_org_admin())
  );

CREATE TABLE IF NOT EXISTS public.blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  banner text,
  slug text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS updated_at timestamptz;

UPDATE public.blogs SET updated_at = COALESCE(updated_at, created_at, now()) WHERE updated_at IS NULL;

UPDATE public.blogs SET slug = id::text WHERE slug IS NULL OR btrim(slug) = '';

ALTER TABLE public.blogs ALTER COLUMN slug SET NOT NULL;

DO $$
BEGIN
  ALTER TABLE public.blogs ADD CONSTRAINT blogs_slug_key UNIQUE (slug);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.blogs
    ADD CONSTRAINT blogs_author_id_profiles_fkey
    FOREIGN KEY (author_id) REFERENCES public.profiles (user_id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS blogs_touch_updated ON public.blogs;
CREATE TRIGGER blogs_touch_updated
  BEFORE UPDATE ON public.blogs
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blogs_select_authenticated" ON public.blogs;
CREATE POLICY "blogs_select_authenticated" ON public.blogs
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR public.is_org_admin()
    OR author_id = auth.uid()
  );

DROP POLICY IF EXISTS "blogs_select_anon_published" ON public.blogs;
CREATE POLICY "blogs_select_anon_published" ON public.blogs
  FOR SELECT TO anon
  USING (status = 'published');

DROP POLICY IF EXISTS "blogs_insert_authenticated" ON public.blogs;
CREATE POLICY "blogs_insert_authenticated" ON public.blogs
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (public.is_super_admin() OR public.is_org_admin())
  );

DROP POLICY IF EXISTS "blogs_update_authenticated" ON public.blogs;
CREATE POLICY "blogs_update_authenticated" ON public.blogs
  FOR UPDATE TO authenticated
  USING (
    author_id = auth.uid()
    OR public.is_super_admin()
    OR public.is_org_admin()
  )
  WITH CHECK (
    author_id = auth.uid()
    OR public.is_super_admin()
    OR public.is_org_admin()
  );

DROP POLICY IF EXISTS "blogs_delete_authenticated" ON public.blogs;
CREATE POLICY "blogs_delete_authenticated" ON public.blogs
  FOR DELETE TO authenticated
  USING (
    author_id = auth.uid()
    OR public.is_super_admin()
    OR public.is_org_admin()
  );

CREATE INDEX IF NOT EXISTS blogs_status_published_at_idx
  ON public.blogs (status, published_at DESC NULLS LAST);

COMMENT ON TABLE public.blogs IS 'Articles de blog (admin) ; lecture publique si status = published.';
