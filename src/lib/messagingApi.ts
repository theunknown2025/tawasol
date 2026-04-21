import { supabase } from "@/lib/supabase";
import type { QueryClient } from "@tanstack/react-query";

export const CHAT_INITIAL_PAGE_SIZE = 10;
export const CHAT_LOAD_MORE_PAGE_SIZE = 25;

export const CHAT_CONVERSATIONS_QUERY_KEY = ["chat", "conversations"] as const;

export function chatMessagesQueryKey(conversationId: string | null) {
  return ["chat", "messages", conversationId] as const;
}

export type ChatConversationKind = "direct" | "group";

export interface ChatConversation {
  id: string;
  kind: ChatConversationKind;
  title: string | null;
  direct_user_a: string | null;
  direct_user_b: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_preview: string | null;
  last_message_at: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export async function listConversations(): Promise<ChatConversation[]> {
  const { data, error } = await supabase
    .from("chat_conversations")
    .select(
      "id, kind, title, direct_user_a, direct_user_b, created_by, created_at, updated_at, last_message_preview, last_message_at"
    )
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as ChatConversation[];
}

export function bumpConversationInListCache(
  queryClient: QueryClient,
  conversationId: string,
  preview: string
): void {
  const now = new Date().toISOString();
  queryClient.setQueryData<ChatConversation[]>(CHAT_CONVERSATIONS_QUERY_KEY, (old) => {
    if (!old) return old;
    const next = old.map((c) =>
      c.id === conversationId
        ? {
            ...c,
            last_message_preview: preview.slice(0, 200),
            last_message_at: now,
            updated_at: now,
          }
        : c
    );
    return [...next].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  });
}

export function subscribeToChatMessages(
  conversationId: string,
  onInsert: (row: ChatMessage) => void
): () => void {
  const channel = supabase
    .channel(`chat-messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const row = payload.new as ChatMessage;
        if (row?.id && row.conversation_id === conversationId) onInsert(row);
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function listConversationMemberIds(conversationId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("chat_conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId);
  if (error) throw error;
  return (data ?? []).map((r) => r.user_id as string);
}

export async function fetchNewestMessages(
  conversationId: string,
  limit: number = CHAT_INITIAL_PAGE_SIZE
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const rows = (data ?? []) as ChatMessage[];
  return rows.slice().reverse();
}

export async function fetchOlderMessages(
  conversationId: string,
  beforeCreatedAt: string,
  limit: number = CHAT_LOAD_MORE_PAGE_SIZE
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .lt("created_at", beforeCreatedAt)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const rows = (data ?? []) as ChatMessage[];
  return rows.slice().reverse();
}

export async function sendChatMessageAs(
  conversationId: string,
  senderId: string,
  body: string
): Promise<ChatMessage> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message vide");
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body: trimmed })
    .select("id, conversation_id, sender_id, body, created_at")
    .single();
  if (error) throw error;
  return data as ChatMessage;
}

export async function getOrCreateDirectConversation(peerUserId: string): Promise<string> {
  const { data, error } = await supabase.rpc("chat_get_or_create_direct", {
    p_peer_user_id: peerUserId,
  });
  if (error) throw error;
  return data as string;
}

export async function createGroupConversation(title: string, memberUserIds: string[]): Promise<string> {
  const { data, error } = await supabase.rpc("chat_create_group", {
    p_title: title,
    p_member_user_ids: memberUserIds,
  });
  if (error) throw error;
  return data as string;
}

export async function addMembersToGroup(conversationId: string, userIds: string[]): Promise<void> {
  const { error } = await supabase.rpc("chat_add_group_members", {
    p_conversation_id: conversationId,
    p_user_ids: userIds,
  });
  if (error) throw error;
}
