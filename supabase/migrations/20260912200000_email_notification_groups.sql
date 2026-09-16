-- Email notification groups (SMTP) — replace Brevo lists

CREATE TABLE IF NOT EXISTS public.email_notification_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.email_notification_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.email_notification_groups (id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_notification_group_members_email_check
    CHECK (char_length(btrim(email)) BETWEEN 5 AND 190 AND strpos(email, '@') > 1)
);

CREATE INDEX IF NOT EXISTS email_notification_groups_is_active_idx
  ON public.email_notification_groups (is_active);

CREATE INDEX IF NOT EXISTS email_notification_group_members_group_id_idx
  ON public.email_notification_group_members (group_id);

CREATE UNIQUE INDEX IF NOT EXISTS email_notification_group_members_group_email_uidx
  ON public.email_notification_group_members (group_id, lower(btrim(email)));

DROP TRIGGER IF EXISTS email_notification_groups_touch ON public.email_notification_groups;
CREATE TRIGGER email_notification_groups_touch
  BEFORE UPDATE ON public.email_notification_groups
  FOR EACH ROW EXECUTE FUNCTION public.lp_landing_touch_updated_at();

ALTER TABLE public.email_notification_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notification_group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_notification_groups_select" ON public.email_notification_groups;
CREATE POLICY "email_notification_groups_select" ON public.email_notification_groups
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "email_notification_groups_insert" ON public.email_notification_groups;
CREATE POLICY "email_notification_groups_insert" ON public.email_notification_groups
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "email_notification_groups_update" ON public.email_notification_groups;
CREATE POLICY "email_notification_groups_update" ON public.email_notification_groups
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "email_notification_groups_delete" ON public.email_notification_groups;
CREATE POLICY "email_notification_groups_delete" ON public.email_notification_groups
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "email_notification_group_members_select" ON public.email_notification_group_members;
CREATE POLICY "email_notification_group_members_select" ON public.email_notification_group_members
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "email_notification_group_members_insert" ON public.email_notification_group_members;
CREATE POLICY "email_notification_group_members_insert" ON public.email_notification_group_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "email_notification_group_members_update" ON public.email_notification_group_members;
CREATE POLICY "email_notification_group_members_update" ON public.email_notification_group_members
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "email_notification_group_members_delete" ON public.email_notification_group_members;
CREATE POLICY "email_notification_group_members_delete" ON public.email_notification_group_members
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

COMMENT ON TABLE public.email_notification_groups IS 'Groupes destinataires pour notifications email (SMTP) des publications.';
COMMENT ON TABLE public.email_notification_group_members IS 'Membres (nom + email) des groupes de notification email.';
