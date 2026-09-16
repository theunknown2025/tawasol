-- Demandes d'information cartographie (formulaire public → revue super admin).

CREATE TABLE IF NOT EXISTS public.cartographie_info_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  fonction text NOT NULL DEFAULT '',
  etablissement text NOT NULL DEFAULT '',
  requested_fields text[] NOT NULL DEFAULT '{}'::text[],
  usage_description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  email_sent_at timestamptz,
  email_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cartographie_info_requests_created_at_idx
  ON public.cartographie_info_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS cartographie_info_requests_status_idx
  ON public.cartographie_info_requests (status);

DROP TRIGGER IF EXISTS cartographie_info_requests_touch ON public.cartographie_info_requests;
CREATE TRIGGER cartographie_info_requests_touch
  BEFORE UPDATE ON public.cartographie_info_requests
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

ALTER TABLE public.cartographie_info_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cartographie_info_requests_insert_public" ON public.cartographie_info_requests;
CREATE POLICY "cartographie_info_requests_insert_public" ON public.cartographie_info_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(full_name)) > 0
    AND length(trim(phone)) > 0
    AND length(trim(email)) > 0
    AND length(trim(usage_description)) > 0
    AND cardinality(requested_fields) > 0
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "cartographie_info_requests_select_super_admin" ON public.cartographie_info_requests;
CREATE POLICY "cartographie_info_requests_select_super_admin" ON public.cartographie_info_requests
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "cartographie_info_requests_update_super_admin" ON public.cartographie_info_requests;
CREATE POLICY "cartographie_info_requests_update_super_admin" ON public.cartographie_info_requests
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "cartographie_info_requests_delete_super_admin" ON public.cartographie_info_requests;
CREATE POLICY "cartographie_info_requests_delete_super_admin" ON public.cartographie_info_requests
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

COMMENT ON TABLE public.cartographie_info_requests IS
  'Demandes publiques d''export des données cartographie (coopératives).';
