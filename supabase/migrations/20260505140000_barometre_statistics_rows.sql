-- Statistiques nationales baromètre (Excel région / secteur), gérées par super admin.

CREATE TABLE IF NOT EXISTS public.barometre_statistics_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int NOT NULL,
  breakdown_type text NOT NULL CHECK (breakdown_type IN ('region', 'sector')),
  category_label text NOT NULL,
  cooperatives int NOT NULL DEFAULT 0 CHECK (cooperatives >= 0),
  adherents int NOT NULL DEFAULT 0 CHECK (adherents >= 0),
  row_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, breakdown_type, category_label)
);

CREATE INDEX IF NOT EXISTS barometre_statistics_rows_year_idx
  ON public.barometre_statistics_rows (year);

CREATE INDEX IF NOT EXISTS barometre_statistics_rows_year_type_idx
  ON public.barometre_statistics_rows (year, breakdown_type);

COMMENT ON TABLE public.barometre_statistics_rows IS
  'Agrégats baromètre (coopératives / adhérents) par région ou par secteur, import Excel.';

ALTER TABLE public.barometre_statistics_rows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "barometre_statistics_rows_super_admin_select" ON public.barometre_statistics_rows;
CREATE POLICY "barometre_statistics_rows_super_admin_select" ON public.barometre_statistics_rows
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "barometre_statistics_rows_super_admin_insert" ON public.barometre_statistics_rows;
CREATE POLICY "barometre_statistics_rows_super_admin_insert" ON public.barometre_statistics_rows
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "barometre_statistics_rows_super_admin_update" ON public.barometre_statistics_rows;
CREATE POLICY "barometre_statistics_rows_super_admin_update" ON public.barometre_statistics_rows
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "barometre_statistics_rows_super_admin_delete" ON public.barometre_statistics_rows;
CREATE POLICY "barometre_statistics_rows_super_admin_delete" ON public.barometre_statistics_rows
  FOR DELETE TO authenticated
  USING (public.is_super_admin());
