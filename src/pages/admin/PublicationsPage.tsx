import { useState, useRef, useMemo } from "react";
import { FileText, Save, Send, Upload, X, Heart, MessageCircle, MousePointerClick, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePublications, type Publication } from "@/hooks/usePublications";
import { Eye, Pencil, Trash2, SendHorizontal, EyeOff } from "lucide-react";
import { HashtagBadge } from "@/components/HashtagBadge";
import { toast } from "sonner";

interface SelectedFile {
  file: File;
  name: string;
  type: string;
  previewUrl: string;
}

export default function PublicationsPage() {
  const {
    publications,
    isLoading,
    addPublication,
    updatePublication,
    deletePublication,
    isCreating,
    isUpdating,
  } = usePublications("mine");
  const [tab, setTab] = useState("nouvelle");
  const [text, setText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  // Auto-extract hashtags from text (#word)
  const tags = useMemo(() => {
    const matches = text.match(/#([a-zA-Z0-9_\u00C0-\u024F-]+)/g) ?? [];
    return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
  }, [text]);
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewPub, setViewPub] = useState<Publication | null>(null);
  const [editPub, setEditPub] = useState<Publication | null>(null);
  const [editText, setEditText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editTags = useMemo(() => {
    const matches = editText.match(/#([a-zA-Z0-9_\u00C0-\u024F-]+)/g) ?? [];
    return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
  }, [editText]);

  const perPage = parseInt(rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(publications.length / perPage));
  const paginated = publications.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Stats
  const totalPublished = publications.filter((p) => p.status === "published").length;
  const totalLikes = publications.reduce((s, p) => s + p.likes, 0);
  const totalComments = publications.reduce((s, p) => s + p.comments.length, 0);
  const totalClicks = publications.reduce((s, p) => s + p.clicks, 0);
  const totalEngagement = totalLikes + totalComments + totalClicks;
  const avgReactivity = totalPublished > 0 ? (totalEngagement / totalPublished).toFixed(1) : "0";

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const newFiles: SelectedFile[] = Array.from(selected).map((f) => ({
      file: f,
      name: f.name,
      type: f.type,
      previewUrl: URL.createObjectURL(f),
    }));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      URL.revokeObjectURL(prev[idx].previewUrl);
      return next;
    });
  };

  const handleSave = async () => {
    if (!text.trim() && selectedFiles.length === 0) return;
    try {
      await addPublication({
        text,
        tags,
        status: "draft",
        files: selectedFiles.map(({ file, name, type }) => ({ file, name, type })),
      });
      setText("");
      setSelectedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      setSelectedFiles([]);
      setTab("liste");
      toast.success("Brouillon enregistré");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    }
  };

  const handlePublish = async () => {
    if (!text.trim() && selectedFiles.length === 0) return;
    try {
      await addPublication({
        text,
        tags,
        status: "published",
        files: selectedFiles.map(({ file, name, type }) => ({ file, name, type })),
      });
      setText("");
      setSelectedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      setSelectedFiles([]);
      setTab("liste");
      toast.success("Publication publiée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la publication");
    }
  };

  const handlePublishDraft = async (id: string) => {
    try {
      await updatePublication(id, { status: "published" });
      toast.success("Publication publiée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await updatePublication(id, { status: "draft" });
      toast.success("Publication retirée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePublication(id);
      toast.success("Publication supprimée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const openEdit = (pub: Publication) => {
    setEditPub(pub);
    setEditText(pub.text);
  };

  const saveEdit = async () => {
    if (!editPub) return;
    try {
      await updatePublication(editPub.id, { text: editText, tags: editTags });
      setEditPub(null);
      toast.success("Modifications enregistrées");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const reactivity = (pub: Publication) => {
    const total = pub.likes + pub.comments.length + pub.clicks;
    return total;
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-primary/10">
          <FileText className="text-primary" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Publications</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="nouvelle">Nouvelle Publication</TabsTrigger>
          <TabsTrigger value="liste">
            Liste Publication
            {publications.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {publications.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Nouvelle Publication ── */}
        <TabsContent value="nouvelle">
          <div className="relative bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
            <Textarea
              placeholder="Rédigez votre publication... (utilisez #tag pour les hashtags)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[180px] resize-y border-0 rounded-none focus-visible:ring-0 pb-24 px-4 pt-4"
            />

            {/* Tags + files - auto inside the text field area above toolbar */}
            {(tags.length > 0 || selectedFiles.length > 0) && (
              <div className="absolute left-4 right-4 bottom-12 flex flex-wrap items-center gap-2 max-h-20 overflow-y-auto">
                {tags.map((t) => (
                  <HashtagBadge key={t} tag={t} />
                ))}
                {selectedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-muted/80 rounded-lg px-2 py-1 text-xs">
                    {f.type.startsWith("image/") ? (
                      <img src={f.previewUrl} alt={f.name} className="w-6 h-6 rounded object-cover" />
                    ) : (
                      <FileText size={12} className="text-muted-foreground" />
                    )}
                    <span className="max-w-[100px] truncate">{f.name}</span>
                    <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Toolbar: Upload + Action icons - inside the text input at bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 border-t border-border bg-muted/30">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                title="Ajouter des fichiers"
                className="h-8 w-8"
              >
                <Upload size={18} />
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSave}
                  title="Enregistrer en brouillon"
                  className="h-8 w-8"
                  disabled={isCreating}
                >
                  <Save size={18} />
                </Button>
                <Button
                  size="icon"
                  onClick={handlePublish}
                  title="Publier"
                  className="h-8 w-8"
                  disabled={isCreating}
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Liste Publication ── */}
        <TabsContent value="liste">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
              <Heart size={18} className="mx-auto mb-1 text-destructive" />
              <p className="text-2xl font-bold text-foreground">{totalLikes}</p>
              <p className="text-xs text-muted-foreground">Likes</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
              <MessageCircle size={18} className="mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold text-foreground">{totalComments}</p>
              <p className="text-xs text-muted-foreground">Commentaires</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
              <MousePointerClick size={18} className="mx-auto mb-1 text-accent" />
              <p className="text-2xl font-bold text-foreground">{totalClicks}</p>
              <p className="text-xs text-muted-foreground">Clics documents</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
              <TrendingUp size={18} className="mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold text-foreground">{avgReactivity}</p>
              <p className="text-xs text-muted-foreground">Réactivité moy.</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
              <FileText size={18} className="mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold text-foreground">{totalPublished}</p>
              <p className="text-xs text-muted-foreground">Publiées</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Toutes les publications</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Lignes :</span>
                <Select value={rowsPerPage} onValueChange={(v) => { setRowsPerPage(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["5", "10", "20", "50"].map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Chargement...</p>
            ) : publications.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                Aucune publication. Créez-en une nouvelle.
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Texte</TableHead>
                      <TableHead className="w-[80px]">Fichiers</TableHead>
                      <TableHead className="w-[110px]">Date</TableHead>
                      <TableHead className="w-[100px]">Statut</TableHead>
                      <TableHead className="w-[60px] text-center">
                        <Heart size={14} className="mx-auto" />
                      </TableHead>
                      <TableHead className="w-[60px] text-center">
                        <MessageCircle size={14} className="mx-auto" />
                      </TableHead>
                      <TableHead className="w-[60px] text-center">
                        <MousePointerClick size={14} className="mx-auto" />
                      </TableHead>
                      <TableHead className="w-[80px] text-center">
                        <span className="text-xs">Réactivité</span>
                      </TableHead>
                      <TableHead className="w-[160px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((pub) => (
                      <TableRow key={pub.id}>
                        <TableCell className="max-w-[200px]">
                          <div className="space-y-1">
                            <p className="truncate">{pub.text || "—"}</p>
                            {(pub.tags ?? []).length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {(pub.tags ?? []).slice(0, 3).map((t) => (
                                  <HashtagBadge key={t} tag={t} />
                                ))}
                                {(pub.tags ?? []).length > 3 && (
                                  <span className="text-xs text-muted-foreground">+{(pub.tags ?? []).length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{pub.files.length}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {pub.createdAt.toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={pub.status === "published" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {pub.status === "published" ? "Publié" : "Brouillon"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium">{pub.likes}</TableCell>
                        <TableCell className="text-center font-medium">{pub.comments.length}</TableCell>
                        <TableCell className="text-center font-medium">{pub.clicks}</TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold text-primary">{reactivity(pub)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setViewPub(pub)} title="Afficher">
                              <Eye size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(pub)} title="Modifier">
                              <Pencil size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(pub.id)} title="Supprimer" className="text-destructive hover:text-destructive">
                              <Trash2 size={16} />
                            </Button>
                            {pub.status === "draft" ? (
                              <Button variant="ghost" size="icon" onClick={() => handlePublishDraft(pub.id)} title="Publier" className="text-primary hover:text-primary">
                                <SendHorizontal size={16} />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon" onClick={() => handleUnpublish(pub.id)} title="Dépublier" className="text-muted-foreground">
                                <EyeOff size={16} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                      Précédent
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentPage} / {totalPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                      Suivant
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={!!viewPub} onOpenChange={() => setViewPub(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Aperçu de la publication</DialogTitle>
            <DialogDescription className="sr-only">
              Affichage du contenu, des pièces jointes et des statistiques de la publication
            </DialogDescription>
          </DialogHeader>
          {viewPub && (
            <div className="space-y-4">
              <p className="whitespace-pre-wrap">{viewPub.text || "Aucun texte"}</p>
              {(viewPub.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(viewPub.tags ?? []).map((t) => (
                    <HashtagBadge key={t} tag={t} />
                  ))}
                </div>
              )}
              {viewPub.files.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {viewPub.files.map((f, i) =>
                    f.type.startsWith("image/") ? (
                      <img key={i} src={f.url} alt={f.name} className="w-32 h-32 rounded-lg object-cover border" />
                    ) : (
                      <div key={i} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                        <FileText size={16} /> {f.name}
                      </div>
                    )
                  )}
                </div>
              )}
              {viewPub.status === "published" && (
                <div className="flex gap-4 text-sm text-muted-foreground border-t border-border pt-3">
                  <span className="flex items-center gap-1"><Heart size={14} /> {viewPub.likes}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={14} /> {viewPub.comments.length}</span>
                  <span className="flex items-center gap-1"><MousePointerClick size={14} /> {viewPub.clicks}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editPub} onOpenChange={() => setEditPub(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier la publication</DialogTitle>
            <DialogDescription className="sr-only">
              Modifier le texte et les hashtags de la publication
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Rédigez... (utilisez #tag pour les hashtags)"
            className="min-h-[120px]"
          />
          {editTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground self-center">Tags :</span>
              {editTags.map((t) => (
                <HashtagBadge key={t} tag={t} />
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditPub(null)}>Annuler</Button>
            <Button onClick={saveEdit} disabled={isUpdating}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
