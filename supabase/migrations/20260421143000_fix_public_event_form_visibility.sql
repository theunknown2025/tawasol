-- Ensure visitors can read forms attached to published events

DROP POLICY IF EXISTS "admin_gestion_forms_select_published_anon" ON public.admin_gestion_forms;

CREATE POLICY "admin_gestion_forms_select_anon_for_public_events" ON public.admin_gestion_forms
  FOR SELECT TO anon
  USING (
    status = 'published'
    OR EXISTS (
      SELECT 1
      FROM public.evenements e
      WHERE e.registration_form_id = admin_gestion_forms.id
        AND e.status = 'published'
    )
  );
