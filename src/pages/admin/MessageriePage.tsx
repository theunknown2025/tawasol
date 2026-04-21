import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Plus,
  Send,
  Users,
  User,
  Loader2,
  ChevronDown,
  UserPlus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useUsers } from "@/hooks/useUsers";
import { useChatMessages } from "@/hooks/useChatMessages";
import type { Profile } from "@/lib/supabase";
import {
  addMembersToGroup,
  bumpConversationInListCache,
  CHAT_CONVERSATIONS_QUERY_KEY,
  CHAT_INITIAL_PAGE_SIZE,
  chatMessagesQueryKey,
  createGroupConversation,
  fetchNewestMessages,
  getOrCreateDirectConversation,
  listConversationMemberIds,
  listConversations,
  sendChatMessageAs,
  type ChatConversation,
} from "@/lib/messagingApi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function ConversationListSkeleton() {
  return (
    <div className="p-2 space-y-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-xl px-3 py-2.5">
          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2 min-w-0 pt-0.5">
            <Skeleton className="h-3.5 w-[72%]" />
            <Skeleton className="h-2.5 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageThreadSkeleton() {
  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className={cn("flex", i % 2 ? "justify-end" : "justify-start")}>
          <Skeleton
            className={cn(
              "h-[52px] rounded-2xl",
              i % 2 ? "w-[min(280px,78%)] rounded-br-md" : "w-[min(260px,72%)] rounded-bl-md"
            )}
          />
        </div>
      ))}
    </div>
  );
}

function profileLabel(p: Profile | undefined): string {
  if (!p) return "Membre";
  return (p.full_name?.trim() || p.email || "Utilisateur").trim();
}

function conversationTitle(
  c: ChatConversation,
  myId: string,
  byUserId: Map<string, Profile>
): string {
  if (c.kind === "group" && c.title?.trim()) return c.title.trim();
  if (c.kind === "direct" && c.direct_user_a && c.direct_user_b) {
    const other = c.direct_user_a === myId ? c.direct_user_b : c.direct_user_a;
    return profileLabel(byUserId.get(other));
  }
  return c.title?.trim() || "Conversation";
}

function formatShortTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function MessageriePage() {
  const { user } = useAuth();
  const myId = user?.id ?? "";
  const queryClient = useQueryClient();
  const { profiles } = useUsers();

  const profileByUserId = useMemo(() => {
    const m = new Map<string, Profile>();
    for (const p of profiles) {
      m.set(p.user_id, p);
    }
    return m;
  }, [profiles]);

  const selectableProfiles = useMemo(() => {
    return profiles.filter(
      (p) =>
        p.user_id !== myId &&
        p.is_active !== false
    );
  }, [profiles, myId]);

  const {
    data: conversations = [],
    isLoading: convLoading,
    error: convError,
  } = useQuery({
    queryKey: CHAT_CONVERSATIONS_QUERY_KEY,
    queryFn: listConversations,
    enabled: !!myId,
    staleTime: 25_000,
  });

  const prefetchThread = useCallback(
    (conversationId: string) => {
      void queryClient.prefetchQuery({
        queryKey: chatMessagesQueryKey(conversationId),
        queryFn: () => fetchNewestMessages(conversationId, CHAT_INITIAL_PAGE_SIZE),
        staleTime: 60_000,
      });
    },
    [queryClient]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const {
    messages,
    loadingInitial,
    isFetchingTail,
    messagesError,
    refetchMessages,
    loadingOlder,
    hasMoreOlder,
    loadOlder,
    appendMessage,
  } = useChatMessages(selectedId);

  const [compose, setCompose] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior });
    });
  }, []);

  useEffect(() => {
    if (!selectedId || loadingInitial) return;
    scrollToBottom("auto");
  }, [selectedId, loadingInitial, scrollToBottom]);

  const [newOpen, setNewOpen] = useState(false);
  const [newTab, setNewTab] = useState<"direct" | "group">("direct");
  const [searchPick, setSearchPick] = useState("");
  const [directPeerId, setDirectPeerId] = useState<string | null>(null);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupPick, setGroupPick] = useState<Set<string>>(() => new Set());
  const [creatingConv, setCreatingConv] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [addPick, setAddPick] = useState<Set<string>>(() => new Set());
  const [existingMemberIds, setExistingMemberIds] = useState<string[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);

  const filteredSelectable = useMemo(() => {
    const q = searchPick.trim().toLowerCase();
    if (!q) return selectableProfiles;
    return selectableProfiles.filter((p) => {
      const name = (p.full_name || "").toLowerCase();
      const mail = (p.email || "").toLowerCase();
      return name.includes(q) || mail.includes(q);
    });
  }, [selectableProfiles, searchPick]);

  const selectedConv = conversations.find((c) => c.id === selectedId) ?? null;

  const openAddMembers = async () => {
    if (!selectedConv || selectedConv.kind !== "group") return;
    setAddSearch("");
    setAddPick(new Set());
    try {
      const ids = await listConversationMemberIds(selectedConv.id);
      setExistingMemberIds(ids);
      setAddOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible de charger les membres");
    }
  };

  const filteredAddCandidates = useMemo(() => {
    const existing = new Set(existingMemberIds);
    const q = addSearch.trim().toLowerCase();
    return selectableProfiles.filter((p) => {
      if (existing.has(p.user_id)) return false;
      if (!q) return true;
      const name = (p.full_name || "").toLowerCase();
      const mail = (p.email || "").toLowerCase();
      return name.includes(q) || mail.includes(q);
    });
  }, [selectableProfiles, existingMemberIds, addSearch]);

  const handleCreateConversation = async () => {
    if (!myId) return;
    setCreatingConv(true);
    try {
      if (newTab === "direct") {
        if (!directPeerId) {
          toast.error("Choisissez un destinataire");
          return;
        }
        const id = await getOrCreateDirectConversation(directPeerId);
        await queryClient.invalidateQueries({ queryKey: CHAT_CONVERSATIONS_QUERY_KEY });
        setSelectedId(id);
        setNewOpen(false);
        setDirectPeerId(null);
        setSearchPick("");
        toast.success("Conversation ouverte");
        return;
      }
      const title =
        groupTitle.trim() ||
        `Groupe — ${new Date().toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}`;
      const ids = [...groupPick];
      if (ids.length === 0) {
        toast.error("Ajoutez au moins un membre au groupe");
        return;
      }
      const id = await createGroupConversation(title, ids);
      await queryClient.invalidateQueries({ queryKey: CHAT_CONVERSATIONS_QUERY_KEY });
      setSelectedId(id);
      setNewOpen(false);
      setGroupTitle("");
      setGroupPick(new Set());
      setSearchPick("");
      toast.success("Groupe créé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setCreatingConv(false);
    }
  };

  const handleAddGroupMembers = async () => {
    if (!selectedId) return;
    const ids = [...addPick];
    if (ids.length === 0) {
      toast.error("Sélectionnez des personnes à ajouter");
      return;
    }
    setAddingMembers(true);
    try {
      await addMembersToGroup(selectedId, ids);
      await queryClient.invalidateQueries({ queryKey: CHAT_CONVERSATIONS_QUERY_KEY });
      setAddOpen(false);
      setAddPick(new Set());
      toast.success("Membres ajoutés");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setAddingMembers(false);
    }
  };

  const handleSend = async () => {
    if (!selectedId || !myId) return;
    const text = compose.trim();
    if (!text) return;
    setSending(true);
    try {
      const msg = await sendChatMessageAs(selectedId, myId, text);
      appendMessage(msg);
      bumpConversationInListCache(queryClient, selectedId, msg.body);
      setCompose("");
      scrollToBottom();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-8 h-[calc(100vh-4rem)] flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <MessageSquare className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Messagerie</h1>
            <p className="text-sm text-muted-foreground">
              Messages individuels ou de groupe avec les membres
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={() => {
            setNewTab("direct");
            setDirectPeerId(null);
            setGroupPick(new Set());
            setGroupTitle("");
            setSearchPick("");
            setNewOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle conversation
        </Button>
      </div>

      <div className="flex flex-1 min-h-0 gap-4 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <aside className="w-full max-w-[320px] shrink-0 border-r border-border flex flex-col min-h-0 bg-muted/20">
          <div className="p-3 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Conversations
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {convLoading ? (
                <ConversationListSkeleton />
              ) : convError ? (
                <p className="text-sm text-destructive px-2">Erreur de chargement</p>
              ) : conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2 py-4">
                  Aucune conversation. Créez-en une pour commencer.
                </p>
              ) : (
                conversations.map((c) => {
                  const title = conversationTitle(c, myId, profileByUserId);
                  const active = c.id === selectedId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      onFocus={() => prefetchThread(c.id)}
                      onMouseEnter={() => prefetchThread(c.id)}
                      className={cn(
                        "w-full text-left rounded-xl px-3 py-2.5 transition-colors duration-150",
                        active ? "bg-primary/15 ring-1 ring-primary/30 shadow-sm" : "hover:bg-muted/80"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={cn(
                            "mt-0.5 p-1.5 rounded-lg shrink-0",
                            c.kind === "group" ? "bg-violet-500/15" : "bg-sky-500/15"
                          )}
                        >
                          {c.kind === "group" ? (
                            <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          ) : (
                            <User className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{title}</div>
                          {c.last_message_preview ? (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {c.last_message_preview}
                            </p>
                          ) : null}
                          {c.last_message_at ? (
                            <p className="text-[10px] text-muted-foreground/80 mt-1">
                              {formatShortTime(c.last_message_at)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </aside>

        <section className="flex-1 flex flex-col min-w-0 min-h-0 bg-gradient-to-b from-muted/35 via-background to-background">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 gap-3">
              <div className="p-4 rounded-2xl bg-muted/50 border border-border/60">
                <Sparkles className="w-10 h-10 opacity-60" />
              </div>
              <p className="text-sm text-center max-w-xs">
                Sélectionnez une conversation dans la liste ou créez-en une nouvelle pour commencer.
              </p>
            </div>
          ) : (
            <>
              <header className="shrink-0 border-b border-border/80 px-4 py-3 flex items-center justify-between gap-2 bg-background/60 backdrop-blur-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="font-semibold truncate">
                      {selectedConv
                        ? conversationTitle(selectedConv, myId, profileByUserId)
                        : "…"}
                    </h2>
                    {isFetchingTail ? (
                      <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                    ) : null}
                  </div>
                  {selectedConv?.kind === "group" ? (
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      Groupe
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      Direct
                    </Badge>
                  )}
                </div>
                {selectedConv?.kind === "group" ? (
                  <Button type="button" variant="outline" size="sm" onClick={openAddMembers}>
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Ajouter des membres
                  </Button>
                ) : null}
              </header>

              <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 space-y-3 max-w-3xl mx-auto">
                  {hasMoreOlder ? (
                    <div className="flex justify-center pb-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground rounded-full hover:bg-muted/80"
                        disabled={loadingOlder}
                        onClick={() => loadOlder()}
                      >
                        {loadingOlder ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 mr-2" />
                        )}
                        Charger plus de messages
                      </Button>
                    </div>
                  ) : null}

                  {messagesError && !loadingInitial ? (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center text-sm">
                      <p className="text-destructive font-medium">Chargement des messages impossible</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => void refetchMessages()}
                      >
                        Réessayer
                      </Button>
                    </div>
                  ) : null}

                  {loadingInitial ? (
                    <MessageThreadSkeleton />
                  ) : messagesError ? null : messages.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-12">
                      Aucun message pour l’instant. Écrivez le premier ci-dessous.
                    </p>
                  ) : (
                    messages.map((m) => {
                      const mine = m.sender_id === myId;
                      const sender = profileByUserId.get(m.sender_id);
                      const who = mine ? "Vous" : profileLabel(sender);
                      return (
                        <div
                          key={m.id}
                          className={cn(
                            "flex animate-in fade-in-0 slide-in-from-bottom-1.5 duration-300",
                            mine ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[85%] rounded-2xl px-3 py-2 text-sm border border-transparent",
                              mine
                                ? "bg-primary text-primary-foreground rounded-br-md shadow-md shadow-primary/20"
                                : "bg-card text-card-foreground rounded-bl-md border-border/60 shadow-sm"
                            )}
                          >
                            {!mine && selectedConv?.kind === "group" ? (
                              <p className="text-[10px] font-medium opacity-80 mb-1">{who}</p>
                            ) : null}
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            <p
                              className={cn(
                                "text-[10px] mt-1.5 opacity-70",
                                mine ? "text-right" : ""
                              )}
                            >
                              {formatShortTime(m.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              <footer className="shrink-0 border-t border-border/80 p-3 bg-background/80 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto flex gap-2 items-end">
                  <Textarea
                    placeholder="Votre message… (Entrée pour envoyer, Maj+Entrée pour une ligne)"
                    className="min-h-[44px] max-h-32 resize-y rounded-xl border-border/80 shadow-sm transition-shadow focus-visible:ring-primary/30"
                    value={compose}
                    onChange={(e) => setCompose(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!sending) void handleSend();
                      }
                    }}
                    disabled={sending}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="shrink-0 h-11 w-11"
                    disabled={sending || !compose.trim()}
                    onClick={() => void handleSend()}
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </footer>
            </>
          )}
        </section>
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Nouvelle conversation</DialogTitle>
            <DialogDescription>
              Envoyez un message à une personne ou créez un groupe nommé avec plusieurs membres.
            </DialogDescription>
          </DialogHeader>
          <Tabs value={newTab} onValueChange={(v) => setNewTab(v as "direct" | "group")} className="flex-1 min-h-0 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="direct">Une personne</TabsTrigger>
              <TabsTrigger value="group">Groupe</TabsTrigger>
            </TabsList>
            <TabsContent value="direct" className="flex-1 min-h-0 flex flex-col gap-3 mt-4">
              <Input
                placeholder="Rechercher par nom ou e-mail…"
                value={searchPick}
                onChange={(e) => setSearchPick(e.target.value)}
              />
              <ScrollArea className="h-[240px] rounded-md border border-border">
                <div className="p-2 space-y-1">
                  {filteredSelectable.map((p) => (
                    <button
                      key={p.user_id}
                      type="button"
                      onClick={() => setDirectPeerId(p.user_id)}
                      className={cn(
                        "w-full text-left rounded-lg px-3 py-2 text-sm transition-colors",
                        directPeerId === p.user_id ? "bg-primary/15 ring-1 ring-primary/40" : "hover:bg-muted"
                      )}
                    >
                      <div className="font-medium">{profileLabel(p)}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="group" className="flex-1 min-h-0 flex flex-col gap-3 mt-4">
              <div className="space-y-2">
                <Label htmlFor="grp-title">Nom du groupe</Label>
                <Input
                  id="grp-title"
                  placeholder="Ex. Équipe projet Alpha"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Si vous laissez vide, un nom sera généré automatiquement.
                </p>
              </div>
              <Input
                placeholder="Filtrer les membres…"
                value={searchPick}
                onChange={(e) => setSearchPick(e.target.value)}
              />
              <ScrollArea className="h-[200px] rounded-md border border-border">
                <div className="p-2 space-y-2">
                  {filteredSelectable.map((p) => {
                    const checked = groupPick.has(p.user_id);
                    return (
                      <label
                        key={p.user_id}
                        className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-muted cursor-pointer"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => {
                            setGroupPick((prev) => {
                              const next = new Set(prev);
                              if (v === true) next.add(p.user_id);
                              else next.delete(p.user_id);
                              return next;
                            });
                          }}
                          className="mt-1"
                        />
                        <span className="min-w-0">
                          <span className="text-sm font-medium block">{profileLabel(p)}</span>
                          <span className="text-xs text-muted-foreground truncate block">{p.email}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNewOpen(false)}>
              Annuler
            </Button>
            <Button type="button" disabled={creatingConv} onClick={() => void handleCreateConversation()}>
              {creatingConv ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {newTab === "direct" ? "Ouvrir" : "Créer le groupe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter des membres au groupe</DialogTitle>
            <DialogDescription>
              Les personnes sélectionnées rejoindront cette conversation de groupe.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Rechercher…"
            value={addSearch}
            onChange={(e) => setAddSearch(e.target.value)}
          />
          <ScrollArea className="h-[220px] rounded-md border border-border">
            <div className="p-2 space-y-2">
              {filteredAddCandidates.map((p) => {
                const checked = addPick.has(p.user_id);
                return (
                  <label
                    key={p.user_id}
                    className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        setAddPick((prev) => {
                          const next = new Set(prev);
                          if (v === true) next.add(p.user_id);
                          else next.delete(p.user_id);
                          return next;
                        });
                      }}
                      className="mt-1"
                    />
                    <span className="min-w-0">
                      <span className="text-sm font-medium block">{profileLabel(p)}</span>
                      <span className="text-xs text-muted-foreground truncate block">{p.email}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Annuler
            </Button>
            <Button type="button" disabled={addingMembers} onClick={() => void handleAddGroupMembers()}>
              {addingMembers ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
