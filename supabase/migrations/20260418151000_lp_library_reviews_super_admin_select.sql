-- Super admin : lecture de tous les avis (stats bibliothèque, ressources brouillon).

CREATE POLICY "lp_library_reviews_select_super" ON public.lp_library_book_reviews
  FOR SELECT TO authenticated
  USING (public.is_super_admin());
