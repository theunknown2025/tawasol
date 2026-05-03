-- Groupes WhatsApp (référentiel pour tous les membres). Super admin uniquement.

CREATE TABLE IF NOT EXISTS public.whatsapp_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  invite_link text NOT NULL DEFAULT '',
  wa_group_jid text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS whatsapp_groups_sort_order_idx ON public.whatsapp_groups (sort_order);
CREATE INDEX IF NOT EXISTS whatsapp_groups_is_active_idx ON public.whatsapp_groups (is_active);

DROP TRIGGER IF EXISTS whatsapp_groups_touch ON public.whatsapp_groups;
CREATE TRIGGER whatsapp_groups_touch
  BEFORE UPDATE ON public.whatsapp_groups
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

ALTER TABLE public.whatsapp_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_groups_select" ON public.whatsapp_groups;
CREATE POLICY "whatsapp_groups_select" ON public.whatsapp_groups
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "whatsapp_groups_insert" ON public.whatsapp_groups;
CREATE POLICY "whatsapp_groups_insert" ON public.whatsapp_groups
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "whatsapp_groups_update" ON public.whatsapp_groups;
CREATE POLICY "whatsapp_groups_update" ON public.whatsapp_groups
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "whatsapp_groups_delete" ON public.whatsapp_groups;
CREATE POLICY "whatsapp_groups_delete" ON public.whatsapp_groups
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

COMMENT ON TABLE public.whatsapp_groups IS 'Groupes WhatsApp partagés avec les membres (référence métier + intégrations futures).';
