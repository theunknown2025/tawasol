-- Complète les politiques RLS : lecture admin complète + mise à jour / suppression super admin.

DROP POLICY IF EXISTS "barometre_cooperatives_super_admin_select" ON public.barometre_cooperatives;
CREATE POLICY "barometre_cooperatives_super_admin_select" ON public.barometre_cooperatives
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "barometre_cooperatives_super_admin_insert" ON public.barometre_cooperatives;
CREATE POLICY "barometre_cooperatives_super_admin_insert" ON public.barometre_cooperatives
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "barometre_cooperatives_super_admin_update" ON public.barometre_cooperatives;
CREATE POLICY "barometre_cooperatives_super_admin_update" ON public.barometre_cooperatives
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "barometre_cooperatives_super_admin_delete" ON public.barometre_cooperatives;
CREATE POLICY "barometre_cooperatives_super_admin_delete" ON public.barometre_cooperatives
  FOR DELETE TO authenticated
  USING (public.is_super_admin());
