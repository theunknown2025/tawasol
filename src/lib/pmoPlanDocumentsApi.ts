import { supabase } from "@/lib/supabase";
import type { ProjetPlanItemDocument } from "@/types/projet";

export const PMO_PLAN_DOCS_BUCKET = "pmo-plan-documents";

export async function fetchDocumentsByPlanItemIds(
  planItemIds: string[]
): Promise<Record<string, ProjetPlanItemDocument[]>> {
  if (planItemIds.length === 0) return {};
  const { data, error } = await supabase
    .from("projet_plan_item_documents")
    .select("id, plan_item_id, storage_path, file_name, mime_type, file_size, created_at")
    .in("plan_item_id", planItemIds)
    .order("created_at", { ascending: false });
  if (error || !data) return {};
  const map: Record<string, ProjetPlanItemDocument[]> = {};
  for (const row of data as ProjetPlanItemDocument[]) {
    if (!map[row.plan_item_id]) map[row.plan_item_id] = [];
    map[row.plan_item_id].push(row);
  }
  return map;
}

export async function uploadPlanItemDocument(
  planItemId: string,
  file: File
): Promise<{ error: string | null }> {
  const safeName = file.name.replace(/[^\w.\-()\s]/g, "_").slice(0, 180);
  const path = `${planItemId}/${crypto.randomUUID()}_${safeName}`;
  const { error: upErr } = await supabase.storage.from(PMO_PLAN_DOCS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (upErr) return { error: upErr.message };
  const { data: userData } = await supabase.auth.getUser();
  const { error: insErr } = await supabase.from("projet_plan_item_documents").insert({
    plan_item_id: planItemId,
    storage_path: path,
    file_name: file.name,
    mime_type: file.type || null,
    file_size: file.size,
    created_by: userData.user?.id ?? null,
  });
  if (insErr) {
    await supabase.storage.from(PMO_PLAN_DOCS_BUCKET).remove([path]);
    return { error: insErr.message };
  }
  return { error: null };
}

export async function deletePlanItemDocument(
  doc: Pick<ProjetPlanItemDocument, "id" | "storage_path">
): Promise<{ error: string | null }> {
  const { error: stErr } = await supabase.storage.from(PMO_PLAN_DOCS_BUCKET).remove([doc.storage_path]);
  if (stErr) return { error: stErr.message };
  const { error: delErr } = await supabase.from("projet_plan_item_documents").delete().eq("id", doc.id);
  if (delErr) return { error: delErr.message };
  return { error: null };
}

export async function getPlanDocumentSignedUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(PMO_PLAN_DOCS_BUCKET)
    .createSignedUrl(storagePath, 3600);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
