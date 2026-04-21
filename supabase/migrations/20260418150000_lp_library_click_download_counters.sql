-- Compteurs publics : clics (ouverture fiche) et téléchargements PDF.

ALTER TABLE public.lp_library_books
  ADD COLUMN IF NOT EXISTS click_count bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS download_count bigint NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_lp_library_book_clicks(p_book_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.lp_library_books
  SET click_count = click_count + 1
  WHERE id = p_book_id AND is_published = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_lp_library_book_downloads(p_book_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.lp_library_books
  SET download_count = download_count + 1
  WHERE id = p_book_id AND is_published = true;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_lp_library_book_clicks(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_lp_library_book_downloads(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_lp_library_book_clicks(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_lp_library_book_clicks(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_lp_library_book_downloads(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_lp_library_book_downloads(uuid) TO authenticated;
