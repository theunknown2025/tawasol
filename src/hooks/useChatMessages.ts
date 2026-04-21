import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CHAT_INITIAL_PAGE_SIZE,
  CHAT_LOAD_MORE_PAGE_SIZE,
  bumpConversationInListCache,
  chatMessagesQueryKey,
  fetchNewestMessages,
  fetchOlderMessages,
  subscribeToChatMessages,
  type ChatMessage,
} from "@/lib/messagingApi";

export function useChatMessages(conversationId: string | null) {
  const queryClient = useQueryClient();
  const [olderByConv, setOlderByConv] = useState<Record<string, ChatMessage[]>>({});
  const [hasMoreOlderByConv, setHasMoreOlderByConv] = useState<Record<string, boolean>>({});
  const [loadingOlder, setLoadingOlder] = useState(false);

  const query = useQuery({
    queryKey: chatMessagesQueryKey(conversationId),
    queryFn: () => fetchNewestMessages(conversationId!, CHAT_INITIAL_PAGE_SIZE),
    enabled: !!conversationId,
    staleTime: 60_000,
    gcTime: 15 * 60_000,
    refetchOnWindowFocus: false,
  });

  const mergedRef = useRef<ChatMessage[]>([]);

  const older = conversationId ? olderByConv[conversationId] ?? [] : [];
  const newest = query.data ?? [];
  const messages = useMemo(() => [...older, ...newest], [older, newest]);

  useEffect(() => {
    mergedRef.current = messages;
  }, [messages]);

  const hasMoreOlder = conversationId ? hasMoreOlderByConv[conversationId] ?? false : false;

  useEffect(() => {
    if (!conversationId || query.isLoading || query.data === undefined) return;
    const data = query.data;
    const o = olderByConv[conversationId] ?? [];
    if (o.length === 0) {
      setHasMoreOlderByConv((m) => ({
        ...m,
        [conversationId]: data.length === CHAT_INITIAL_PAGE_SIZE,
      }));
    }
  }, [conversationId, query.isLoading, query.data, olderByConv]);

  useEffect(() => {
    if (!conversationId) return;
    return subscribeToChatMessages(conversationId, (row) => {
      queryClient.setQueryData<ChatMessage[]>(chatMessagesQueryKey(conversationId), (prev) => {
        const p = prev ?? [];
        if (p.some((m) => m.id === row.id)) return p;
        return [...p, row];
      });
      bumpConversationInListCache(queryClient, conversationId, row.body);
    });
  }, [conversationId, queryClient]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || loadingOlder) return;
    const msgs = mergedRef.current;
    if (msgs.length === 0) return;
    const oldest = msgs[0];
    setLoadingOlder(true);
    try {
      const batch = await fetchOlderMessages(
        conversationId,
        oldest.created_at,
        CHAT_LOAD_MORE_PAGE_SIZE
      );
      setOlderByConv((prev) => ({
        ...prev,
        [conversationId]: [...batch, ...(prev[conversationId] ?? [])],
      }));
      setHasMoreOlderByConv((m) => ({
        ...m,
        [conversationId]: batch.length === CHAT_LOAD_MORE_PAGE_SIZE,
      }));
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, loadingOlder]);

  const appendMessage = useCallback(
    (msg: ChatMessage) => {
      if (!conversationId) return;
      queryClient.setQueryData<ChatMessage[]>(chatMessagesQueryKey(conversationId), (prev) => {
        const p = prev ?? [];
        if (p.some((m) => m.id === msg.id)) return p;
        return [...p, msg];
      });
    },
    [conversationId, queryClient]
  );

  return {
    messages,
    loadingInitial: !!conversationId && query.isLoading,
    isFetchingTail: !!conversationId && query.isFetching && !query.isLoading,
    messagesError: query.error,
    refetchMessages: query.refetch,
    loadingOlder,
    hasMoreOlder,
    loadOlder,
    appendMessage,
  };
}
