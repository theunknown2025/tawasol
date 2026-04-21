-- Bibliothèque publique : PDF, publication, avis (note + commentaire).
-- Lecture header landing pour visiteurs anonymes (singleton default).

ALTER TABLE public.lp_library_books
  ADD COLUMN IF NOT EXISTS pdf_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

UPDATE public.lp_library_books SET published_at = created_at WHERE is_published = true AND published_at IS NULL;

CREATE OR REPLACE FUNCTION public.lp_library_books_set_published_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_published THEN
    NEW.published_at = COALESCE(NEW.published_at, now());
  ELSIF TG_OP = 'UPDATE' AND NEW.is_published IS DISTINCT FROM OLD.is_published AND NEW.is_published THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lp_library_books_published_at ON public.lp_library_books;
CREATE TRIGGER lp_library_books_published_at
  BEFORE INSERT OR UPDATE ON public.lp_library_books
  FOR EACH ROW EXECUTE FUNCTION public.lp_library_books_set_published_at();

DROP POLICY IF EXISTS "lp_library_books_select" ON public.lp_library_books;
CREATE POLICY "lp_library_books_select_super" ON public.lp_library_books
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "lp_library_books_select_published_anon" ON public.lp_library_books
  FOR SELECT TO anon
  USING (is_published = true);

CREATE POLICY "lp_library_books_select_published_auth" ON public.lp_library_books
  FOR SELECT TO authenticated
  USING (is_published = true);

CREATE TABLE IF NOT EXISTS public.lp_library_book_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.lp_library_books (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  comment text NOT NULL DEFAULT '',
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lp_library_book_reviews_comment_trim CHECK (char_length(trim(comment)) >= 1)
);

CREATE INDEX IF NOT EXISTS lp_library_book_reviews_book_id_idx ON public.lp_library_book_reviews (book_id);

ALTER TABLE public.lp_library_book_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_library_reviews_select" ON public.lp_library_book_reviews;
DROP POLICY IF EXISTS "lp_library_reviews_select_anon" ON public.lp_library_book_reviews;
DROP POLICY IF EXISTS "lp_library_reviews_select_auth" ON public.lp_library_book_reviews;
CREATE POLICY "lp_library_reviews_select_anon" ON public.lp_library_book_reviews
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.lp_library_books b
      WHERE b.id = book_id AND b.is_published = true
    )
  );
CREATE POLICY "lp_library_reviews_select_auth" ON public.lp_library_book_reviews
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lp_library_books b
      WHERE b.id = book_id AND b.is_published = true
    )
  );

DROP POLICY IF EXISTS "lp_library_reviews_insert" ON public.lp_library_book_reviews;
CREATE POLICY "lp_library_reviews_insert" ON public.lp_library_book_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.lp_library_books b
      WHERE b.id = book_id AND b.is_published = true
    )
  );

COMMENT ON TABLE public.lp_library_book_reviews IS 'Avis publics (note 1–5 + commentaire) sur les livres publiés.';

DROP POLICY IF EXISTS "lp_landing_header_select_anon" ON public.lp_landing_header;
CREATE POLICY "lp_landing_header_select_anon" ON public.lp_landing_header
  FOR SELECT TO anon
  USING (id = 'default');
