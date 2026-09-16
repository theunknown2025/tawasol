import { supabase } from "@/lib/supabase";
import type { EmailGroup, EmailGroupMember, EmailGroupMemberInput } from "./emailGroupTypes";

const GROUP_SELECT = "*, members:email_notification_group_members(*)";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  const e = normalizeEmail(email);
  return e.length >= 5 && e.length <= 190 && e.includes("@") && !e.startsWith("@") && !e.endsWith("@");
}

export async function listEmailGroups(): Promise<EmailGroup[]> {
  const { data, error } = await supabase
    .from("email_notification_groups")
    .select(GROUP_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as EmailGroup[];
}

export async function createEmailGroup(params: {
  name: string;
  members: EmailGroupMemberInput[];
  created_by: string | null;
}): Promise<EmailGroup> {
  const name = params.name.trim();
  if (!name) throw new Error("Le nom du groupe est obligatoire");

  const members = dedupeMembers(params.members);
  if (members.length === 0) throw new Error("Ajoutez au moins un membre (nom + email)");

  const { data: group, error } = await supabase
    .from("email_notification_groups")
    .insert({
      name,
      is_active: true,
      created_by: params.created_by,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const { error: memErr } = await supabase.from("email_notification_group_members").insert(
    members.map((m) => ({
      group_id: group.id,
      full_name: m.full_name.trim(),
      email: normalizeEmail(m.email),
    })),
  );

  if (memErr) {
    await supabase.from("email_notification_groups").delete().eq("id", group.id);
    throw new Error(memErr.message);
  }

  const full = await getEmailGroup(group.id);
  return full;
}

export async function getEmailGroup(id: string): Promise<EmailGroup> {
  const { data, error } = await supabase
    .from("email_notification_groups")
    .select(GROUP_SELECT)
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as EmailGroup;
}

export async function updateEmailGroup(params: {
  id: string;
  name: string;
  is_active?: boolean;
  members: EmailGroupMemberInput[];
}): Promise<EmailGroup> {
  const name = params.name.trim();
  if (!name) throw new Error("Le nom du groupe est obligatoire");

  const members = dedupeMembers(params.members);
  if (members.length === 0) throw new Error("Ajoutez au moins un membre (nom + email)");

  const { error: gErr } = await supabase
    .from("email_notification_groups")
    .update({
      name,
      ...(params.is_active !== undefined ? { is_active: params.is_active } : {}),
    })
    .eq("id", params.id);

  if (gErr) throw new Error(gErr.message);

  const { error: delErr } = await supabase
    .from("email_notification_group_members")
    .delete()
    .eq("group_id", params.id);

  if (delErr) throw new Error(delErr.message);

  const { error: memErr } = await supabase.from("email_notification_group_members").insert(
    members.map((m) => ({
      group_id: params.id,
      full_name: m.full_name.trim(),
      email: normalizeEmail(m.email),
    })),
  );

  if (memErr) throw new Error(memErr.message);

  return getEmailGroup(params.id);
}

export async function deleteEmailGroup(id: string): Promise<void> {
  const { error } = await supabase.from("email_notification_groups").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

function dedupeMembers(members: EmailGroupMemberInput[]): EmailGroupMemberInput[] {
  const seen = new Set<string>();
  const out: EmailGroupMemberInput[] = [];
  for (const m of members) {
    const email = normalizeEmail(m.email);
    const full_name = m.full_name.trim();
    if (!full_name || !isValidEmail(email)) continue;
    if (seen.has(email)) continue;
    seen.add(email);
    out.push({ full_name, email });
  }
  return out;
}

export type { EmailGroupMember };
