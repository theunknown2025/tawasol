-- Qualify public.* in storage RLS so super_admin can read admin-documents (createSignedUrl / download).
DROP POLICY IF EXISTS "admin_documents_select" ON storage.objects;
CREATE POLICY "admin_documents_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'admin-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_super_admin()
    )
  );

DROP POLICY IF EXISTS "admin_documents_insert" ON storage.objects;
CREATE POLICY "admin_documents_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'admin-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.is_org_admin()
  );

DROP POLICY IF EXISTS "admin_documents_delete" ON storage.objects;
CREATE POLICY "admin_documents_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'admin-documents'
    AND (
      (
        (storage.foldername(name))[1] = auth.uid()::text
        AND public.is_org_admin()
      )
      OR public.is_super_admin()
    )
  );
