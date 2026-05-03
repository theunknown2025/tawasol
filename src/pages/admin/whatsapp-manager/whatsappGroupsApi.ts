import { supabase } from "@/lib/supabase";
import type { WhatsappGroup, WhatsappGroupInsert, WhatsappGroupUpdate } from "./types";

export async function listWhatsappGroups(): Promise<WhatsappGroup[]> {
  const { data, error } = await supabase
    .from("whatsapp_groups")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as WhatsappGroup[];
}

export async function createWhatsappGroup(row: WhatsappGroupInsert): Promise<WhatsappGroup> {
  const payload = {
    name: row.name.trim(),
    description: row.description ?? "",
    invite_link: row.invite_link ?? "",
    wa_group_jid: row.wa_group_jid ?? "",
    brevo_list_id: row.brevo_list_id ?? null,
    notes: row.notes ?? "",
    sort_order: row.sort_order ?? 0,
    is_active: row.is_active ?? true,
    notify_publications: row.notify_publications ?? true,
    notify_events: row.notify_events ?? true,
    notify_blogs: row.notify_blogs ?? true,
    metadata: row.metadata ?? {},
    created_by: row.created_by,
  };
  const { data, error } = await supabase.from("whatsapp_groups").insert(payload).select("*").single();

  if (error) throw new Error(error.message);
  return data as WhatsappGroup;
}

export async function updateWhatsappGroup(id: string, patch: WhatsappGroupUpdate): Promise<WhatsappGroup> {
  const { data, error } = await supabase.from("whatsapp_groups").update(patch).eq("id", id).select("*").single();

  if (error) throw new Error(error.message);
  return data as WhatsappGroup;
}

export async function deleteWhatsappGroup(id: string): Promise<void> {
  const { error } = await supabase.from("whatsapp_groups").delete().eq("id", id);

  if (error) throw new Error(error.message);
}
