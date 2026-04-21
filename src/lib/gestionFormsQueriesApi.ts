import { supabase } from "@/lib/supabase";
import type { GestionForm, GestionFormField } from "@/types/gestionForm";

type DbGestionForm = {
  id: string;
  title: string;
  description: string;
  banner_url: string;
  form_description: string;
  fields: unknown;
  submit_message_enabled: boolean;
  submit_message: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
};

function mapDbToGestionForm(row: DbGestionForm): GestionForm {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    banner: row.banner_url ?? "",
    formDescription: row.form_description ?? "",
    fields: (Array.isArray(row.fields) ? row.fields : []) as GestionFormField[],
    submitMessageEnabled: row.submit_message_enabled,
    submitMessage: row.submit_message ?? "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchMyGestionForms(): Promise<GestionForm[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return [];

  const { data, error } = await supabase
    .from("admin_gestion_forms")
    .select("*")
    .eq("created_by", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as DbGestionForm[]).map(mapDbToGestionForm);
}

export async function fetchPublishedGestionForms(): Promise<GestionForm[]> {
  const { data, error } = await supabase
    .from("admin_gestion_forms")
    .select("*")
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as DbGestionForm[]).map(mapDbToGestionForm);
}
