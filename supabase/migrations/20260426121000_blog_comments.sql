CREATE TABLE IF NOT EXISTS public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_comments_blog_id_created_at_idx
  ON public.blog_comments (blog_id, created_at DESC);

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_comments_select_public" ON public.blog_comments;
CREATE POLICY "blog_comments_select_public" ON public.blog_comments
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.blogs b
      WHERE b.id = blog_comments.blog_id
        AND b.status = 'published'
    )
  );

DROP POLICY IF EXISTS "blog_comments_insert_public" ON public.blog_comments;
CREATE POLICY "blog_comments_insert_public" ON public.blog_comments
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(btrim(author_name)) BETWEEN 2 AND 120
    AND char_length(btrim(author_email)) BETWEEN 5 AND 190
    AND strpos(author_email, '@') > 1
    AND char_length(btrim(comment)) BETWEEN 2 AND 5000
    AND rating BETWEEN 1 AND 5
    AND EXISTS (
      SELECT 1
      FROM public.blogs b
      WHERE b.id = blog_comments.blog_id
        AND b.status = 'published'
    )
  );

COMMENT ON TABLE public.blog_comments IS 'Avis et commentaires publics sur les articles de blog.';
