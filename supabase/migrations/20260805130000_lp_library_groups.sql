-- Groupes de documents bibliothèque (onglets de navigation).

CREATE TABLE IF NOT EXISTS public.lp_library_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lp_library_groups_name_trim CHECK (char_length(trim(name)) >= 1)
);

DROP TRIGGER IF EXISTS lp_library_groups_touch ON public.lp_library_groups;
CREATE TRIGGER lp_library_groups_touch
  BEFORE UPDATE ON public.lp_library_groups
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

ALTER TABLE public.lp_library_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_library_groups_select_super" ON public.lp_library_groups;
CREATE POLICY "lp_library_groups_select_super" ON public.lp_library_groups
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_library_groups_select_anon" ON public.lp_library_groups;
CREATE POLICY "lp_library_groups_select_anon" ON public.lp_library_groups
  FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "lp_library_groups_select_auth_public" ON public.lp_library_groups;
CREATE POLICY "lp_library_groups_select_auth_public" ON public.lp_library_groups
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "lp_library_groups_insert" ON public.lp_library_groups;
CREATE POLICY "lp_library_groups_insert" ON public.lp_library_groups
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_library_groups_update" ON public.lp_library_groups;
CREATE POLICY "lp_library_groups_update" ON public.lp_library_groups
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_library_groups_delete" ON public.lp_library_groups;
CREATE POLICY "lp_library_groups_delete" ON public.lp_library_groups
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

COMMENT ON TABLE public.lp_library_groups IS
  'Groupes / onglets de navigation pour les ressources bibliothèque.';

-- Groupe par défaut pour les documents existants
INSERT INTO public.lp_library_groups (id, name, sort_order)
SELECT 'a0000000-0000-4000-8000-000000000001'::uuid, 'Article et Publications', 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.lp_library_groups WHERE name = 'Article et Publications'
);

ALTER TABLE public.lp_library_books
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.lp_library_groups (id) ON DELETE RESTRICT;

UPDATE public.lp_library_books b
SET group_id = g.id
FROM public.lp_library_groups g
WHERE b.group_id IS NULL
  AND g.name = 'Article et Publications';

ALTER TABLE public.lp_library_books
  ALTER COLUMN group_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS lp_library_books_group_id_idx
  ON public.lp_library_books (group_id);

COMMENT ON COLUMN public.lp_library_books.group_id IS
  'Groupe / onglet de navigation de la ressource.';
