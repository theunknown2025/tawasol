-- Ensure writes to section visibility return a row (detect silent RLS failures)
-- and provide a SECURITY DEFINER upsert used by the editor.

CREATE OR REPLACE FUNCTION public.upsert_lp_landing_section_visibility(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_payload jsonb;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'invalid payload';
  END IF;

  INSERT INTO public.lp_landing_section_visibility AS t (id, payload, updated_by)
  VALUES ('default', p_payload, auth.uid())
  ON CONFLICT (id) DO UPDATE
    SET payload = EXCLUDED.payload,
        updated_by = EXCLUDED.updated_by,
        updated_at = now()
  RETURNING t.payload INTO v_payload;

  RETURN v_payload;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_lp_landing_section_visibility(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_lp_landing_section_visibility(jsonb) TO authenticated;

COMMENT ON FUNCTION public.upsert_lp_landing_section_visibility(jsonb) IS
  'Super-admin only upsert of landing section visibility singleton.';
