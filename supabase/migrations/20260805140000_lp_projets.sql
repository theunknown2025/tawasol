-- Public landing Projets: CRUD under LP Manager, public list/detail pages

CREATE TABLE IF NOT EXISTS public.lp_projets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  title text NOT NULL,
  banner jsonb NOT NULL DEFAULT '{"type":"solid","color":"#0f766e"}'::jsonb,
  date_debut date,
  date_fin date,
  description text NOT NULL DEFAULT '',
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  zones jsonb NOT NULL DEFAULT '[]'::jsonb,
  partners jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  public_slug text UNIQUE,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lp_projets_status_idx ON public.lp_projets (status);
CREATE INDEX IF NOT EXISTS lp_projets_published_at_idx ON public.lp_projets (published_at DESC NULLS LAST);

UPDATE public.lp_projets
SET public_slug = encode(gen_random_bytes(9), 'hex')
WHERE public_slug IS NULL;

ALTER TABLE public.lp_projets
  ALTER COLUMN public_slug SET DEFAULT encode(gen_random_bytes(9), 'hex');

CREATE TABLE IF NOT EXISTS public.lp_projets_public_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  display_mode text NOT NULL DEFAULT 'card' CHECK (display_mode IN ('card', 'rows')),
  page_size int NOT NULL DEFAULT 15 CHECK (page_size IN (5, 15, 50)),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.lp_projets_public_settings (id, display_mode, page_size)
VALUES (1, 'card', 15)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.lp_projets_set_updated_at()
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
  IF NEW.status IS DISTINCT FROM 'published' THEN
    NEW.published_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lp_projets_set_updated_at ON public.lp_projets;
CREATE TRIGGER lp_projets_set_updated_at
  BEFORE INSERT OR UPDATE ON public.lp_projets
  FOR EACH ROW EXECUTE FUNCTION public.lp_projets_set_updated_at();

ALTER TABLE public.lp_projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lp_projets_public_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_projets_select_published_anon" ON public.lp_projets;
CREATE POLICY "lp_projets_select_published_anon" ON public.lp_projets
  FOR SELECT TO anon
  USING (status = 'published');

DROP POLICY IF EXISTS "lp_projets_select_auth" ON public.lp_projets;
CREATE POLICY "lp_projets_select_auth" ON public.lp_projets
  FOR SELECT TO authenticated
  USING (
    status = 'published'
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "lp_projets_insert" ON public.lp_projets;
CREATE POLICY "lp_projets_insert" ON public.lp_projets
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_projets_update" ON public.lp_projets;
CREATE POLICY "lp_projets_update" ON public.lp_projets
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_projets_delete" ON public.lp_projets;
CREATE POLICY "lp_projets_delete" ON public.lp_projets
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_projets_public_settings_select" ON public.lp_projets_public_settings;
CREATE POLICY "lp_projets_public_settings_select" ON public.lp_projets_public_settings
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "lp_projets_public_settings_manage" ON public.lp_projets_public_settings;
CREATE POLICY "lp_projets_public_settings_manage" ON public.lp_projets_public_settings
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

GRANT SELECT ON public.lp_projets TO anon;
GRANT SELECT ON public.lp_projets_public_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lp_projets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lp_projets_public_settings TO authenticated;
