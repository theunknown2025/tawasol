-- Per-user publication likes with toggle (like / unlike)

CREATE TABLE IF NOT EXISTS public.publication_likes (
  publication_id uuid NOT NULL REFERENCES public.publications (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (publication_id, user_id)
);

CREATE INDEX IF NOT EXISTS publication_likes_user_id_idx
  ON public.publication_likes (user_id);

ALTER TABLE public.publication_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "publication_likes_select" ON public.publication_likes;
CREATE POLICY "publication_likes_select" ON public.publication_likes
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "publication_likes_insert" ON public.publication_likes;
CREATE POLICY "publication_likes_insert" ON public.publication_likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "publication_likes_delete" ON public.publication_likes;
CREATE POLICY "publication_likes_delete" ON public.publication_likes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.publication_likes TO authenticated;

-- Atomic toggle: insert → like (+1), delete → unlike (−1).
-- SECURITY DEFINER so any authenticated user can update publications.likes
-- (plain UPDATE on publications is restricted to author/admin).
CREATE OR REPLACE FUNCTION public.toggle_publication_like(p_publication_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_liked boolean;
  v_likes integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.publications WHERE id = p_publication_id) THEN
    RAISE EXCEPTION 'Publication introuvable';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.publication_likes
    WHERE publication_id = p_publication_id
      AND user_id = v_uid
  ) THEN
    DELETE FROM public.publication_likes
    WHERE publication_id = p_publication_id
      AND user_id = v_uid;

    UPDATE public.publications
    SET likes = GREATEST(0, likes - 1),
        updated_at = now()
    WHERE id = p_publication_id
    RETURNING likes INTO v_likes;

    v_liked := false;
  ELSE
    INSERT INTO public.publication_likes (publication_id, user_id)
    VALUES (p_publication_id, v_uid);

    UPDATE public.publications
    SET likes = likes + 1,
        updated_at = now()
    WHERE id = p_publication_id
    RETURNING likes INTO v_likes;

    v_liked := true;
  END IF;

  RETURN jsonb_build_object('likes', v_likes, 'liked', v_liked);
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_publication_like(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_publication_like(uuid) TO authenticated;

COMMENT ON TABLE public.publication_likes IS
  'Likes utilisateurs sur les publications du Mur (un like par utilisateur).';
COMMENT ON FUNCTION public.toggle_publication_like(uuid) IS
  'Active ou désactive le like de l’utilisateur courant sur une publication.';
