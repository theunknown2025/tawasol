-- Bilan REMESS : documents annuels publics (PDF, avis, analytics).

CREATE TABLE IF NOT EXISTS public.lp_bilan_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL CHECK (year >= 1990 AND year <= 2100),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  pdf_url text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  click_count bigint NOT NULL DEFAULT 0,
  download_count bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS lp_bilan_documents_year_idx
  ON public.lp_bilan_documents (year DESC);

CREATE INDEX IF NOT EXISTS lp_bilan_documents_published_idx
  ON public.lp_bilan_documents (is_published, year DESC);

DROP TRIGGER IF EXISTS lp_bilan_documents_touch ON public.lp_bilan_documents;
CREATE TRIGGER lp_bilan_documents_touch
  BEFORE UPDATE ON public.lp_bilan_documents
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

CREATE OR REPLACE FUNCTION public.lp_bilan_documents_set_published_at()
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

DROP TRIGGER IF EXISTS lp_bilan_documents_published_at ON public.lp_bilan_documents;
CREATE TRIGGER lp_bilan_documents_published_at
  BEFORE INSERT OR UPDATE ON public.lp_bilan_documents
  FOR EACH ROW EXECUTE FUNCTION public.lp_bilan_documents_set_published_at();

ALTER TABLE public.lp_bilan_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_bilan_documents_select_super" ON public.lp_bilan_documents;
CREATE POLICY "lp_bilan_documents_select_super" ON public.lp_bilan_documents
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "lp_bilan_documents_select_published_anon" ON public.lp_bilan_documents;
CREATE POLICY "lp_bilan_documents_select_published_anon" ON public.lp_bilan_documents
  FOR SELECT TO anon
  USING (is_published = true);

DROP POLICY IF EXISTS "lp_bilan_documents_select_published_auth" ON public.lp_bilan_documents;
CREATE POLICY "lp_bilan_documents_select_published_auth" ON public.lp_bilan_documents
  FOR SELECT TO authenticated
  USING (is_published = true OR public.is_super_admin());

DROP POLICY IF EXISTS "lp_bilan_documents_insert" ON public.lp_bilan_documents;
CREATE POLICY "lp_bilan_documents_insert" ON public.lp_bilan_documents
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_bilan_documents_update" ON public.lp_bilan_documents;
CREATE POLICY "lp_bilan_documents_update" ON public.lp_bilan_documents
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "lp_bilan_documents_delete" ON public.lp_bilan_documents;
CREATE POLICY "lp_bilan_documents_delete" ON public.lp_bilan_documents
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

COMMENT ON TABLE public.lp_bilan_documents IS 'Bilans REMESS annuels (PDF) pour la landing et la page publique.';

-- Avis (note + commentaire)
CREATE TABLE IF NOT EXISTS public.lp_bilan_document_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.lp_bilan_documents (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  comment text NOT NULL DEFAULT '',
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lp_bilan_document_reviews_comment_trim CHECK (char_length(trim(comment)) >= 1)
);

CREATE INDEX IF NOT EXISTS lp_bilan_document_reviews_document_id_idx
  ON public.lp_bilan_document_reviews (document_id);

ALTER TABLE public.lp_bilan_document_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_bilan_reviews_select_anon" ON public.lp_bilan_document_reviews;
CREATE POLICY "lp_bilan_reviews_select_anon" ON public.lp_bilan_document_reviews
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.lp_bilan_documents d
      WHERE d.id = document_id AND d.is_published = true
    )
  );

DROP POLICY IF EXISTS "lp_bilan_reviews_select_auth" ON public.lp_bilan_document_reviews;
CREATE POLICY "lp_bilan_reviews_select_auth" ON public.lp_bilan_document_reviews
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lp_bilan_documents d
      WHERE d.id = document_id AND d.is_published = true
    )
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "lp_bilan_reviews_insert" ON public.lp_bilan_document_reviews;
CREATE POLICY "lp_bilan_reviews_insert" ON public.lp_bilan_document_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.lp_bilan_documents d
      WHERE d.id = document_id AND d.is_published = true
    )
  );

COMMENT ON TABLE public.lp_bilan_document_reviews IS 'Avis publics (note 1–5 + commentaire) sur les bilans REMESS publiés.';

-- Historique clics / téléchargements
CREATE TABLE IF NOT EXISTS public.lp_bilan_document_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.lp_bilan_documents (id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('click', 'download')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lp_bilan_document_events_doc_created_idx
  ON public.lp_bilan_document_events (document_id, created_at DESC);

ALTER TABLE public.lp_bilan_document_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_bilan_document_events_select_super" ON public.lp_bilan_document_events;
CREATE POLICY "lp_bilan_document_events_select_super" ON public.lp_bilan_document_events
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE OR REPLACE FUNCTION public.increment_lp_bilan_document_clicks(p_document_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.lp_bilan_documents
  SET click_count = click_count + 1
  WHERE id = p_document_id AND is_published = true;

  IF FOUND THEN
    INSERT INTO public.lp_bilan_document_events (document_id, event_type)
    VALUES (p_document_id, 'click');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_lp_bilan_document_downloads(p_document_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.lp_bilan_documents
  SET download_count = download_count + 1
  WHERE id = p_document_id AND is_published = true;

  IF FOUND THEN
    INSERT INTO public.lp_bilan_document_events (document_id, event_type)
    VALUES (p_document_id, 'download');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_lp_bilan_document_clicks(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_lp_bilan_document_downloads(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_lp_bilan_document_clicks(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_lp_bilan_document_clicks(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_lp_bilan_document_downloads(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_lp_bilan_document_downloads(uuid) TO authenticated;

COMMENT ON TABLE public.lp_bilan_document_events IS
  'Événements horodatés (clic / téléchargement) pour les statistiques Bilan REMESS.';
