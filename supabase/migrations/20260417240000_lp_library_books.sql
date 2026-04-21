-- Bibliothèque LP : ouvrages (couverture, métadonnées, mots-clés). Super admin uniquement.

CREATE TABLE IF NOT EXISTS public.lp_library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cover_url text NOT NULL DEFAULT '',
  title text NOT NULL,
  author text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  keywords text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS lp_library_books_touch ON public.lp_library_books;
CREATE TRIGGER lp_library_books_touch
  BEFORE UPDATE ON public.lp_library_books
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

ALTER TABLE public.lp_library_books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_library_books_select" ON public.lp_library_books;
CREATE POLICY "lp_library_books_select" ON public.lp_library_books
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_library_books_insert" ON public.lp_library_books;
CREATE POLICY "lp_library_books_insert" ON public.lp_library_books
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_library_books_update" ON public.lp_library_books;
CREATE POLICY "lp_library_books_update" ON public.lp_library_books
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_library_books_delete" ON public.lp_library_books;
CREATE POLICY "lp_library_books_delete" ON public.lp_library_books
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

COMMENT ON TABLE public.lp_library_books IS 'Ressources bibliothèque (livres) pour le gestionnaire LP.';
