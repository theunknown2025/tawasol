import { supabase } from "@/lib/supabase";

/** Row from `public.waha_integration_config` (table name kept for DB compatibility). */
export interface IntegrationConfig {
  id: string;
  public_site_url: string;
  brevo_notes: string;
  internal_notes: string;
  updated_at: string;
  updated_by: string | null;
}

export async function getIntegrationConfig(): Promise<IntegrationConfig | null> {
  const { data, error } = await supabase
    .from("waha_integration_config")
    .select("id, public_site_url, brevo_notes, internal_notes, updated_at, updated_by")
    .eq("id", "default")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as IntegrationConfig | null;
}

export async function upsertIntegrationConfig(patch: {
  public_site_url: string;
  brevo_notes: string;
  internal_notes: string;
}): Promise<IntegrationConfig> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;

  const { data, error } = await supabase
    .from("waha_integration_config")
    .upsert(
      {
        id: "default",
        public_site_url: patch.public_site_url.trim(),
        brevo_notes: patch.brevo_notes.trim(),
        internal_notes: patch.internal_notes.trim(),
        updated_by: uid,
      },
      { onConflict: "id" },
    )
    .select("id, public_site_url, brevo_notes, internal_notes, updated_at, updated_by")
    .single();

  if (error) throw new Error(error.message);
  return data as IntegrationConfig;
}
