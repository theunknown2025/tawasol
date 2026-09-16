import { supabase } from "@/lib/supabase";

export interface GreenApiMessagingConfig {
  id: string;
  instance_id: string;
  api_token: string;
  api_url: string;
  group_name: string;
  group_chat_id: string;
  notes: string;
  updated_at: string;
  updated_by: string | null;
}

export async function getGreenApiMessagingConfig(): Promise<GreenApiMessagingConfig | null> {
  const { data, error } = await supabase
    .from("green_api_messaging_config")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as GreenApiMessagingConfig | null;
}

function extractGroupChatId(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  const embedded = t.match(/(\d{8,}@g\.us)\b/i);
  if (embedded?.[1]) return embedded[1];
  if (t.endsWith("@g.us")) return t;
  return t;
}

export async function upsertGreenApiMessagingConfig(patch: {
  instance_id: string;
  api_token: string;
  api_url: string;
  group_name: string;
  group_chat_id: string;
  notes: string;
}): Promise<GreenApiMessagingConfig> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;

  const { data, error } = await supabase
    .from("green_api_messaging_config")
    .upsert(
      {
        id: "default",
        instance_id: patch.instance_id.trim(),
        api_token: patch.api_token.trim(),
        api_url: patch.api_url.trim().replace(/\/$/, "") || "https://api.green-api.com",
        group_name: patch.group_name.trim(),
        group_chat_id: extractGroupChatId(patch.group_chat_id),
        notes: patch.notes.trim(),
        updated_by: uid,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as GreenApiMessagingConfig;
}
