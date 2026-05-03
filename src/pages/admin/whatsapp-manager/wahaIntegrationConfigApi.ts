import { supabase } from "@/lib/supabase";

export interface WahaIntegrationConfig {
  id: string;
  public_site_url: string;
  brevo_notes: string;
  waha_base_url_note: string;
  internal_notes: string;
  updated_at: string;
  updated_by: string | null;
}

export async function getWahaIntegrationConfig(): Promise<WahaIntegrationConfig | null> {
  const { data, error } = await supabase.from("waha_integration_config").select("*").eq("id", "default").maybeSingle();

  if (error) throw new Error(error.message);
  return data as WahaIntegrationConfig | null;
}

export async function upsertWahaIntegrationConfig(patch: {
  public_site_url: string;
  brevo_notes: string;
  waha_base_url_note: string;
  internal_notes: string;
}): Promise<WahaIntegrationConfig> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;

  const { data, error } = await supabase
    .from("waha_integration_config")
    .upsert(
      {
        id: "default",
        public_site_url: patch.public_site_url.trim(),
        brevo_notes: patch.brevo_notes.trim(),
        waha_base_url_note: patch.waha_base_url_note.trim(),
        internal_notes: patch.internal_notes.trim(),
        updated_by: uid,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as WahaIntegrationConfig;
}
