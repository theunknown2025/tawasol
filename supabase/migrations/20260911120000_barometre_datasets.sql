-- Flexible Baromètre datasets: editable columns/rows + chart config.

CREATE TABLE IF NOT EXISTS public.barometre_datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  x_column_id text,
  y_column_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  chart_type text NOT NULL DEFAULT 'bar'
    CHECK (chart_type IN ('bar', 'line', 'area', 'pie')),
  is_published boolean NOT NULL DEFAULT false,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS barometre_datasets_published_order_idx
  ON public.barometre_datasets (is_published, display_order, created_at DESC);

CREATE OR REPLACE FUNCTION public.barometre_datasets_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS barometre_datasets_touch ON public.barometre_datasets;
CREATE TRIGGER barometre_datasets_touch
  BEFORE UPDATE ON public.barometre_datasets
  FOR EACH ROW EXECUTE FUNCTION public.barometre_datasets_touch_updated_at();

COMMENT ON TABLE public.barometre_datasets IS
  'Baromètre: tables dynamiques (colonnes/lignes JSON) et config de graphique.';

ALTER TABLE public.barometre_datasets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "barometre_datasets_super_admin_select" ON public.barometre_datasets;
CREATE POLICY "barometre_datasets_super_admin_select" ON public.barometre_datasets
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "barometre_datasets_super_admin_insert" ON public.barometre_datasets;
CREATE POLICY "barometre_datasets_super_admin_insert" ON public.barometre_datasets
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "barometre_datasets_super_admin_update" ON public.barometre_datasets;
CREATE POLICY "barometre_datasets_super_admin_update" ON public.barometre_datasets
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "barometre_datasets_super_admin_delete" ON public.barometre_datasets;
CREATE POLICY "barometre_datasets_super_admin_delete" ON public.barometre_datasets
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

GRANT SELECT ON TABLE public.barometre_datasets TO anon, authenticated;

DROP POLICY IF EXISTS "barometre_datasets_select_published_anon" ON public.barometre_datasets;
CREATE POLICY "barometre_datasets_select_published_anon" ON public.barometre_datasets
  FOR SELECT TO anon
  USING (is_published = true);

DROP POLICY IF EXISTS "barometre_datasets_select_published_auth" ON public.barometre_datasets;
CREATE POLICY "barometre_datasets_select_published_auth" ON public.barometre_datasets
  FOR SELECT TO authenticated
  USING (is_published = true OR public.is_super_admin());
