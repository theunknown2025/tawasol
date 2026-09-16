import { supabase } from "@/lib/supabase";

export type GreenApiMessageSendRow = {
  id: string;
  source: string;
  content_type: string | null;
  content_title: string;
  group_name: string;
  group_chat_id: string;
  message_text: string;
  status: string;
  green_message_id: string | null;
  error_message: string | null;
  sent_at: string;
};

export async function listGreenApiMessageSends(): Promise<GreenApiMessageSendRow[]> {
  const { data, error } = await supabase
    .from("green_api_message_sends")
    .select(
      "id, source, content_type, content_title, group_name, group_chat_id, message_text, status, green_message_id, error_message, sent_at",
    )
    .order("sent_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);
  return (data ?? []) as GreenApiMessageSendRow[];
}
