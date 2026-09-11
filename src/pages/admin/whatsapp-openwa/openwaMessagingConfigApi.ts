import { supabase } from "@/lib/supabase";

export interface OpenwaMessagingConfig {
  id: string;
  group_name: string;
  group_invite_link: string;
  group_jid: string;
  notes: string;
  updated_at: string;
  updated_by: string | null;
}

export async function getOpenwaMessagingConfig(): Promise<OpenwaMessagingConfig | null> {
  const { data, error } = await supabase
    .from("openwa_messaging_config")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as OpenwaMessagingConfig | null;
}

export async function upsertOpenwaMessagingConfig(patch: {
  group_name: string;
  group_invite_link: string;
  group_jid: string;
  notes: string;
}): Promise<OpenwaMessagingConfig> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;

  const { data, error } = await supabase
    .from("openwa_messaging_config")
    .upsert(
      {
        id: "default",
        group_name: patch.group_name.trim(),
        group_invite_link: patch.group_invite_link.trim(),
        group_jid: patch.group_jid.trim(),
        notes: patch.notes.trim(),
        updated_by: uid,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as OpenwaMessagingConfig;
}
