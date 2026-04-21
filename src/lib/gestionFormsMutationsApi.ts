import { supabase } from "@/lib/supabase";
import type { GestionFormInput } from "@/types/gestionForm";

const BANNERS_BUCKET = "gestion-forms-banners";

export async function createGestionForm(input: GestionFormInput): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Non authentifie");
  }

  const { error } = await supabase.from("admin_gestion_forms").insert({
    created_by: user.id,
    title: input.title,
    description: input.description,
    banner_url: input.banner ?? "",
    form_description: input.formDescription,
    fields: input.fields,
    submit_message_enabled: input.submitMessageEnabled,
    submit_message: input.submitMessage,
    status: input.status,
    published_at: input.status === "published" ? new Date().toISOString() : null,
  });

  if (error) throw error;
}

export async function updateGestionForm(id: string, input: GestionFormInput): Promise<void> {
  const { error } = await supabase
    .from("admin_gestion_forms")
    .update({
      title: input.title,
      description: input.description,
      banner_url: input.banner ?? "",
      form_description: input.formDescription,
      fields: input.fields,
      submit_message_enabled: input.submitMessageEnabled,
      submit_message: input.submitMessage,
      status: input.status,
      published_at: input.status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteGestionForm(id: string): Promise<void> {
  const { error } = await supabase.from("admin_gestion_forms").delete().eq("id", id);
  if (error) throw error;
}

export async function setGestionFormPublishStatus(
  id: string,
  status: "draft" | "published"
): Promise<void> {
  const { error } = await supabase
    .from("admin_gestion_forms")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function uploadGestionFormBanner(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = `banners/${fileName}`;

  const { error } = await supabase.storage.from(BANNERS_BUCKET).upload(filePath, file, {
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BANNERS_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
