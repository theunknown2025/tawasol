import { supabase, type Profile } from "@/lib/supabase";

export const ADMIN_DOCUMENTS_BUCKET = "admin-documents";

export type AdminDocCategory =
  | "liste_membre"
  | "assemblee_generale"
  | "bilan_activite"
  | "bilan_financier"
  | "autre";

export const ADMIN_DOC_CATEGORY_LABELS: Record<AdminDocCategory, string> = {
  liste_membre: "Liste de membre",
  assemblee_generale: "Assemblée générale",
  bilan_activite: "Bilan d'activité",
  bilan_financier: "Bilan financier",
  autre: "Autre",
};

export interface AdminOrganizationProfileRow {
  user_id: string;
  organization_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
  description: string | null;
  rep_full_name: string | null;
  rep_fonction: string | null;
  rep_email: string | null;
  rep_phone: string | null;
  statut_liste_membre: boolean;
  statut_assemblee_generale: boolean;
  statut_bilan_activite: boolean;
  statut_bilan_financier: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminProfileLinkRow {
  id: string;
  user_id: string;
  label: string | null;
  url: string;
  sort_order: number;
  created_at: string;
}

export interface AdminLegalDocumentRow {
  id: string;
  user_id: string;
  category: AdminDocCategory;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

export async function fetchAdminOrganizationProfile(
  userId: string
): Promise<AdminOrganizationProfileRow | null> {
  const { data, error } = await supabase
    .from("admin_organization_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as AdminOrganizationProfileRow | null;
}

export async function fetchAdminProfileLinks(userId: string): Promise<AdminProfileLinkRow[]> {
  const { data, error } = await supabase
    .from("admin_profile_links")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminProfileLinkRow[];
}

export async function fetchAdminLegalDocuments(userId: string): Promise<AdminLegalDocumentRow[]> {
  const { data, error } = await supabase
    .from("admin_legal_documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AdminLegalDocumentRow[];
}

export type AdminOrgProfileInput = Omit<
  AdminOrganizationProfileRow,
  "user_id" | "created_at" | "updated_at"
>;

export async function upsertAdminOrganizationProfile(
  userId: string,
  input: AdminOrgProfileInput
): Promise<void> {
  const { error } = await supabase.from("admin_organization_profiles").upsert(
    {
      user_id: userId,
      organization_name: input.organization_name,
      contact_email: input.contact_email,
      contact_phone: input.contact_phone,
      contact_address: input.contact_address,
      description: input.description,
      rep_full_name: input.rep_full_name,
      rep_fonction: input.rep_fonction,
      rep_email: input.rep_email,
      rep_phone: input.rep_phone,
      statut_liste_membre: input.statut_liste_membre,
      statut_assemblee_generale: input.statut_assemblee_generale,
      statut_bilan_activite: input.statut_bilan_activite,
      statut_bilan_financier: input.statut_bilan_financier,
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

export async function replaceAdminProfileLinks(
  userId: string,
  links: { id?: string; label: string; url: string; sort_order: number }[]
): Promise<void> {
  const { error: delErr } = await supabase.from("admin_profile_links").delete().eq("user_id", userId);
  if (delErr) throw delErr;
  if (links.length === 0) return;
  const { error: insErr } = await supabase.from("admin_profile_links").insert(
    links.map((l, i) => ({
      user_id: userId,
      label: l.label.trim() || null,
      url: l.url.trim(),
      sort_order: l.sort_order ?? i,
    }))
  );
  if (insErr) throw insErr;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180);
}

export async function uploadAdminLegalDocument(
  userId: string,
  file: File,
  category: AdminDocCategory
): Promise<AdminLegalDocumentRow> {
  const id = crypto.randomUUID();
  const safeName = sanitizeFileName(file.name);
  const path = `${userId}/${id}_${safeName}`;

  const { error: upErr } = await supabase.storage.from(ADMIN_DOCUMENTS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (upErr) throw upErr;

  const { data: row, error: insErr } = await supabase
    .from("admin_legal_documents")
    .insert({
      user_id: userId,
      category,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type || null,
      file_size: file.size,
    })
    .select()
    .single();
  if (insErr) throw insErr;
  return row as AdminLegalDocumentRow;
}

export async function deleteAdminLegalDocument(doc: AdminLegalDocumentRow): Promise<void> {
  const { error: stErr } = await supabase.storage.from(ADMIN_DOCUMENTS_BUCKET).remove([doc.storage_path]);
  if (stErr) throw stErr;
  const { error } = await supabase.from("admin_legal_documents").delete().eq("id", doc.id);
  if (error) throw error;
}

export async function getAdminDocumentSignedUrl(
  storagePath: string,
  expiresIn = 3600
): Promise<string> {
  const path = storagePath.replace(/^\/+/, "").trim();
  if (!path) throw new Error("Chemin de fichier invalide");

  const { data, error } = await supabase.storage
    .from(ADMIN_DOCUMENTS_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(error.message || "Impossible de générer l’URL signée (droits ou fichier manquant)");
  }
  if (!data?.signedUrl) throw new Error("URL signée indisponible");
  return data.signedUrl;
}

export async function adminSetProfileActive(userId: string, isActive: boolean): Promise<Profile> {
  const { data, error } = await supabase.rpc("admin_set_profile_active", {
    p_user_id: userId,
    p_is_active: isActive,
  });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as Profile;
  if (!row) throw new Error("Réponse vide");
  return row;
}
