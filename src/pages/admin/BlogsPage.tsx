import { useState } from "react";
import { NotebookPen, Eye, Pencil, Trash2, SendHorizontal, EyeOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBlogs, type Blog } from "@/hooks/useBlogs";
import { toast } from "sonner";

export default function BlogsPage() {
  const {
    blogs: myBlogs,
    isLoading: isLoadingMine,
    addBlog,
    updateBlog,
    deleteBlog,
    isCreating,
    isUpdating,
  } = useBlogs("mine");

  const { blogs: allBlogs, isLoading: isLoadingAll } = useBlogs("all");

  const [tab, setTab] = useState<"new" | "mine" | "all">("new");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [banner, setBanner] = useState("");

  const [viewBlog, setViewBlog] = useState<Blog | null>(null);
  const [editBlog, setEditBlog] = useState<Blog | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editBanner, setEditBanner] = useState("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setContent("");
    setBanner("");
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!title.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }

    try {
      await addBlog({
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        banner: banner.trim() || null,
        status,
      });
      resetForm();
      setTab("mine");
      toast.success(status === "published" ? "Blog publié" : "Brouillon enregistré");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement du blog");
    }
  };

  const openEdit = (blog: Blog) => {
    setEditBlog(blog);
    setEditTitle(blog.title);
    setEditDescription(blog.description);
    setEditContent(blog.content);
    setEditBanner(blog.banner ?? "");
  };

  const saveEdit = async () => {
    if (!editBlog) return;
    if (!editTitle.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }

    try {
      await updateBlog(editBlog.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        content: editContent.trim(),
        banner: editBanner.trim() || null,
      });
      toast.success("Blog mis à jour");
      setEditBlog(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la mise à jour du blog");
    }
  };

  const handlePublishToggle = async (blog: Blog) => {
    try {
      await updateBlog(blog.id, {
        status: blog.status === "published" ? "draft" : "published",
      });
      toast.success(
        blog.status === "published" ? "Blog dépublié (brouillon)" : "Blog publié"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du changement de statut");
    }
  };

  const handleDelete = async (blog: Blog) => {
    try {
      await deleteBlog(blog.id);
      toast.success("Blog supprimé");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression du blog");
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-primary/10">
          <NotebookPen className="text-primary" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blogs</h1>
          <p className="text-sm text-muted-foreground">
            Rédigez vos articles, gérez vos blogs et découvrez ceux des autres administrateurs.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
        <TabsList className="mb-6">
          <TabsTrigger value="new">Nouveau blog</TabsTrigger>
          <TabsTrigger value="mine">
            Mes blogs
            {myBlogs.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {myBlogs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">
            Tous les blogs
            {allBlogs.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {allBlogs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            {/* Banner preview */}
            <div
              className="h-40 w-full bg-gradient-to-r from-primary/70 via-primary/40 to-primary/10 flex items-center justify-center text-white text-lg font-semibold"
              style={
                banner
                  ? {
                      backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.4)), url(${banner})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              {!banner && <span>Bannière du blog</span>}
            </div>

            <div className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Titre du blog <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Titre accrocheur de votre article"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    URL de la bannière
                  </label>
                  <Input
                    placeholder="https://exemple.com/image.jpg"
                    value={banner}
                    onChange={(e) => setBanner(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ajoutez l&apos;URL d&apos;une image pour l&apos;afficher en bannière de votre blog.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Description courte
                </label>
                <Textarea
                  placeholder="Quelques lignes pour décrire brièvement le sujet de votre article."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Contenu (éditeur de texte)
                </label>
                <Textarea
                  placeholder="Rédigez ici le contenu complet de votre blog..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Vous pouvez enregistrer en brouillon ou publier immédiatement votre blog.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={isCreating}
                    onClick={() => handleSave("draft")}
                  >
                    Enregistrer en brouillon
                  </Button>
                  <Button disabled={isCreating} onClick={() => handleSave("published")}>
                    Publier
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mine">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Mes blogs</h2>
            </div>

            {isLoadingMine ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Chargement...</p>
            ) : myBlogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Vous n&apos;avez encore aucun blog. Créez-en un dans l&apos;onglet &quot;Nouveau blog&quot;.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="w-[110px]">Date</TableHead>
                    <TableHead className="w-[100px]">Statut</TableHead>
                    <TableHead className="w-[160px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myBlogs.map((blog) => (
                    <TableRow key={blog.id}>
                      <TableCell className="font-medium">{blog.title}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[260px]">
                        <p className="truncate text-sm text-muted-foreground">
                          {blog.description || "—"}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {blog.createdAt.toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={blog.status === "published" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {blog.status === "published" ? "Publié" : "Brouillon"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Afficher"
                            onClick={() => setViewBlog(blog)}
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Modifier"
                            onClick={() => openEdit(blog)}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Supprimer"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(blog)}
                          >
                            <Trash2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={blog.status === "published" ? "Dépublier" : "Publier"}
                            className={
                              blog.status === "published"
                                ? "text-muted-foreground"
                                : "text-primary hover:text-primary"
                            }
                            onClick={() => handlePublishToggle(blog)}
                          >
                            {blog.status === "published" ? (
                              <EyeOff size={16} />
                            ) : (
                              <SendHorizontal size={16} />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Tous les blogs des administrateurs</h2>
              <p className="text-xs text-muted-foreground">
                Consultez les articles publiés par les autres admins.
              </p>
            </div>

            {isLoadingAll ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Chargement...</p>
            ) : allBlogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Aucun blog enregistré pour le moment.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead className="hidden md:table-cell">Auteur</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="w-[110px]">Date</TableHead>
                    <TableHead className="w-[100px]">Statut</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allBlogs.map((blog) => (
                    <TableRow key={blog.id}>
                      <TableCell className="font-medium">{blog.title}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {blog.authorName}
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[260px]">
                        <p className="truncate text-sm text-muted-foreground">
                          {blog.description || "—"}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {blog.createdAt.toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={blog.status === "published" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {blog.status === "published" ? "Publié" : "Brouillon"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Afficher"
                            onClick={() => setViewBlog(blog)}
                          >
                            <Eye size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* View dialog */}
      <Dialog open={!!viewBlog} onOpenChange={() => setViewBlog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewBlog?.title ?? "Détail du blog"}</DialogTitle>
            <DialogDescription className="sr-only">
              Détails complets du blog sélectionné
            </DialogDescription>
          </DialogHeader>
          {viewBlog && (
            <div className="space-y-4">
              {viewBlog.banner && (
                <div
                  className="h-40 w-full rounded-lg bg-cover bg-center"
                  style={{ backgroundImage: `url(${viewBlog.banner})` }}
                />
              )}
              <p className="text-sm text-muted-foreground">
                Par <span className="font-medium text-foreground">{viewBlog.authorName}</span> ·{" "}
                {viewBlog.createdAt.toLocaleDateString("fr-FR")}
              </p>
              {viewBlog.description && (
                <p className="text-sm text-muted-foreground">{viewBlog.description}</p>
              )}
              <div className="border-t border-border pt-3">
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {viewBlog.content || "Aucun contenu"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editBlog} onOpenChange={() => setEditBlog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le blog</DialogTitle>
            <DialogDescription className="sr-only">
              Modifier le titre, la description, la bannière et le contenu du blog
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Titre du blog <span className="text-destructive">*</span>
              </label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Titre du blog"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">URL de la bannière</label>
              <Input
                value={editBanner}
                onChange={(e) => setEditBanner(e.target.value)}
                placeholder="https://exemple.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Description courte
              </label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Contenu</label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[160px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditBlog(null)}>
                Annuler
              </Button>
              <Button onClick={saveEdit} disabled={isUpdating}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

