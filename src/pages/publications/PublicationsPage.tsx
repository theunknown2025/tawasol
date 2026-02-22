import { useState, useRef } from "react";
import { FileText, Save, Send, Upload, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePublications } from "@/hooks/usePublications";
import {
  addPublication,
  updatePublication,
  deletePublication,
  type Publication,
} from "@/stores/publicationsStore";
import { Eye, Pencil, Trash2, SendHorizonal } from "lucide-react";

export default function PublicationsPage() {
  const publications = usePublications();
  const [tab, setTab] = useState("nouvelle");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<{ name: string; type: string; url: string }[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewPub, setViewPub] = useState<Publication | null>(null);
  const [editPub, setEditPub] = useState<Publication | null>(null);
  const [editText, setEditText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const drafts = publications.filter((p) => p.status === "draft");
  const perPage = parseInt(rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(drafts.length / perPage));
  const paginatedDrafts = drafts.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const newFiles = Array.from(selected).map((f) => ({
      name: f.name,
      type: f.type,
      url: URL.createObjectURL(f),
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!text.trim() && files.length === 0) return;
    addPublication({ text, files, status: "draft" });
    setText("");
    setFiles([]);
    setTab("liste");
  };

  const handlePublish = () => {
    if (!text.trim() && files.length === 0) return;
    addPublication({ text, files, status: "published", publishedAt: new Date() });
    setText("");
    setFiles([]);
    setTab("liste");
  };

  const handlePublishDraft = (id: string) => {
    updatePublication(id, { status: "published", publishedAt: new Date() });
  };

  const handleDelete = (id: string) => {
    deletePublication(id);
  };

  const openEdit = (pub: Publication) => {
    setEditPub(pub);
    setEditText(pub.text);
  };

  const saveEdit = () => {
    if (editPub) {
      updatePublication(editPub.id, { text: editText });
      setEditPub(null);
    }
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
            {drafts.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {drafts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Nouvelle Publication ── */}
        <TabsContent value="nouvelle">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
            <Textarea
              placeholder="Rédigez votre publication..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[160px] resize-y"
            />

            {/* File upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                className="hidden"
                onChange={handleFiles}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload size={16} /> Ajouter des fichiers
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Images ou PDF uniquement
              </p>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 text-sm"
                  >
                    {f.type.startsWith("image/") ? (
                      <img src={f.url} alt={f.name} className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <FileText size={16} className="text-muted-foreground" />
                    )}
                    <span className="max-w-[140px] truncate">{f.name}</span>
                    <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleSave} className="gap-2">
                <Save size={16} /> Enregistrer
              </Button>
              <Button onClick={handlePublish} className="gap-2">
                <Send size={16} /> Publier
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── Liste Publication ── */}
        <TabsContent value="liste">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Brouillons</h2>
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

            {drafts.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                Aucun brouillon. Créez une publication et enregistrez-la.
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Texte</TableHead>
                      <TableHead className="w-[100px]">Fichiers</TableHead>
                      <TableHead className="w-[120px]">Date</TableHead>
                      <TableHead className="w-[100px]">Statut</TableHead>
                      <TableHead className="w-[160px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDrafts.map((pub) => (
                      <TableRow key={pub.id}>
                        <TableCell className="max-w-[300px] truncate">{pub.text || "—"}</TableCell>
                        <TableCell>{pub.files.length}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {pub.createdAt.toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">Brouillon</Badge>
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
                            <Button variant="ghost" size="icon" onClick={() => handlePublishDraft(pub.id)} title="Publier" className="text-primary hover:text-primary">
                              <SendHorizonal size={16} />
                            </Button>
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
          </DialogHeader>
          {viewPub && (
            <div className="space-y-4">
              <p className="whitespace-pre-wrap">{viewPub.text || "Aucun texte"}</p>
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editPub} onOpenChange={() => setEditPub(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier la publication</DialogTitle>
          </DialogHeader>
          <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-[120px]" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditPub(null)}>Annuler</Button>
            <Button onClick={saveEdit}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
