-- Historique temporel des clics / téléchargements (pour graphiques admin).
-- Les totaux cumulés restent sur lp_library_books.click_count / download_count.

CREATE TABLE IF NOT EXISTS public.lp_library_book_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.lp_library_books (id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('click', 'download')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lp_library_book_events_book_created_idx
  ON public.lp_library_book_events (book_id, created_at DESC);

CREATE INDEX IF NOT EXISTS lp_library_book_events_type_created_idx
  ON public.lp_library_book_events (event_type, created_at DESC);

ALTER TABLE public.lp_library_book_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_library_book_events_select_super" ON public.lp_library_book_events;
CREATE POLICY "lp_library_book_events_select_super" ON public.lp_library_book_events
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- Pas d'INSERT/UPDATE/DELETE directs : uniquement via RPC SECURITY DEFINER.

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

  IF FOUND THEN
    INSERT INTO public.lp_library_book_events (book_id, event_type)
    VALUES (p_book_id, 'click');
  END IF;
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

  IF FOUND THEN
    INSERT INTO public.lp_library_book_events (book_id, event_type)
    VALUES (p_book_id, 'download');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_lp_library_book_clicks(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_lp_library_book_downloads(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_lp_library_book_clicks(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_lp_library_book_clicks(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_lp_library_book_downloads(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_lp_library_book_downloads(uuid) TO authenticated;

COMMENT ON TABLE public.lp_library_book_events IS
  'Événements horodatés (clic / téléchargement) pour l’historique graphique bibliothèque.';
