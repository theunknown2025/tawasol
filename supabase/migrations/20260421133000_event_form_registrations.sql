-- Attach Gestion Form to events + public registrations with answers

ALTER TABLE public.evenements
  ADD COLUMN IF NOT EXISTS registration_form_id uuid REFERENCES public.admin_gestion_forms (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS public_slug text UNIQUE;

UPDATE public.evenements
SET public_slug = COALESCE(public_slug, encode(gen_random_bytes(9), 'hex'))
WHERE public_slug IS NULL;

ALTER TABLE public.evenements
  ALTER COLUMN public_slug SET DEFAULT encode(gen_random_bytes(9), 'hex');

CREATE TABLE IF NOT EXISTS public.event_form_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.evenements (id) ON DELETE CASCADE,
  applicant_name text NOT NULL,
  applicant_email text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_form_registrations_event_id_idx
  ON public.event_form_registrations (event_id);

CREATE INDEX IF NOT EXISTS event_form_registrations_status_idx
  ON public.event_form_registrations (status);

ALTER TABLE public.event_form_registrations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.event_form_registrations_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS event_form_registrations_set_updated_at ON public.event_form_registrations;
CREATE TRIGGER event_form_registrations_set_updated_at
  BEFORE UPDATE ON public.event_form_registrations
  FOR EACH ROW EXECUTE FUNCTION public.event_form_registrations_set_updated_at();

DROP POLICY IF EXISTS "event_form_registrations_insert_public" ON public.event_form_registrations;
CREATE POLICY "event_form_registrations_insert_public" ON public.event_form_registrations
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.evenements e
      WHERE e.id = event_id
        AND e.status = 'published'
        AND e.registration_form_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "event_form_registrations_select_admin" ON public.event_form_registrations;
CREATE POLICY "event_form_registrations_select_admin" ON public.event_form_registrations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.evenements e
      WHERE e.id = event_id
        AND e.author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "event_form_registrations_update_admin" ON public.event_form_registrations;
CREATE POLICY "event_form_registrations_update_admin" ON public.event_form_registrations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.evenements e
      WHERE e.id = event_id
        AND e.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.evenements e
      WHERE e.id = event_id
        AND e.author_id = auth.uid()
    )
  );
