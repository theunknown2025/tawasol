import { supabase } from "@/lib/supabase";
import type { ProjetDocument } from "@/types/projet";

export const PROJET_DOCS_BUCKET = "projet-documents";

export async function fetchDocumentsByProjetIds(
  projetIds: string[]
): Promise<Record<string, ProjetDocument[]>> {
  if (projetIds.length === 0) return {};
  const { data, error } = await supabase
    .from("projet_documents")
    .select("id, projet_id, storage_path, file_name, mime_type, file_size, created_at")
    .in("projet_id", projetIds)
    .order("created_at", { ascending: false });
  if (error || !data) return {};
  const map: Record<string, ProjetDocument[]> = {};
  for (const row of data as ProjetDocument[]) {
    if (!map[row.projet_id]) map[row.projet_id] = [];
    map[row.projet_id].push(row);
  }
  return map;
}

export async function uploadProjetDocument(
  projetId: string,
  file: File
): Promise<{ error: string | null }> {
  const safeName = file.name.replace(/[^\w.\-()\s]/g, "_").slice(0, 180);
  const path = `${projetId}/${crypto.randomUUID()}_${safeName}`;
  const { error: upErr } = await supabase.storage.from(PROJET_DOCS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (upErr) return { error: upErr.message };
  const { data: userData } = await supabase.auth.getUser();
  const { error: insErr } = await supabase.from("projet_documents").insert({
    projet_id: projetId,
    storage_path: path,
    file_name: file.name,
    mime_type: file.type || null,
    file_size: file.size,
    created_by: userData.user?.id ?? null,
  });
  if (insErr) {
    await supabase.storage.from(PROJET_DOCS_BUCKET).remove([path]);
    return { error: insErr.message };
  }
  return { error: null };
}

export async function deleteProjetDocument(
  doc: Pick<ProjetDocument, "id" | "storage_path">
): Promise<{ error: string | null }> {
  const { error: stErr } = await supabase.storage.from(PROJET_DOCS_BUCKET).remove([doc.storage_path]);
  if (stErr) return { error: stErr.message };
  const { error: delErr } = await supabase.from("projet_documents").delete().eq("id", doc.id);
  if (delErr) return { error: delErr.message };
  return { error: null };
}

export async function getProjetDocumentSignedUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(PROJET_DOCS_BUCKET)
    .createSignedUrl(storagePath, 3600);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
