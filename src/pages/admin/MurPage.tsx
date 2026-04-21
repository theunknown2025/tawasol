import { useState, useEffect } from "react";
import { LayoutGrid, Heart, Trash2, EyeOff, Send, FileText, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { usePublications, type Publication } from "@/hooks/usePublications";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/supabase";
import { HashtagBadge } from "@/components/HashtagBadge";
import { PublicationCardWithAI } from "./MURAI";
import { toast } from "sonner";

const MAX_PREVIEW_IMAGES = 4;

export default function MurPage() {
  const { profile } = useAuth();
  const canManage = profile?.role === ROLES.SUPER_ADMIN || profile?.role === ROLES.ADMIN;
  const isSuperAdmin = profile?.role === ROLES.SUPER_ADMIN;
  const {
    publications,
    isLoading,
    error,
    refetch,
    updatePublication,
    deletePublication,
    toggleLike,
    addComment,
    incrementClicks,
  } = usePublications();
  const published = publications.filter((p) => p.status === "published");
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [galleryState, setGalleryState] = useState<{
    images: { name: string; type: string; url: string }[];
    currentIndex: number;
    publication: Publication;
  } | null>(null);

  const openGallery = (
    publication: Publication,
    images: { name: string; type: string; url: string }[],
    index: number
  ) => {
    setGalleryState({ images, currentIndex: index, publication });
  };

  const closeGallery = () => setGalleryState(null);

  const goPrev = () => {
    if (!galleryState) return;
    setGalleryState((s) =>
      s ? { ...s, currentIndex: (s.currentIndex - 1 + s.images.length) % s.images.length } : null
    );
  };

  const goNext = () => {
    if (!galleryState) return;
    setGalleryState((s) =>
      s ? { ...s, currentIndex: (s.currentIndex + 1) % s.images.length } : null
    );
  };

  useEffect(() => {
    if (!galleryState) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") closeGallery();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [galleryState]);

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

  const handleComment = async (id: string) => {
    const text = commentTexts[id]?.trim();
    if (!text) return;
    try {
      await addComment(id, text);
      setCommentTexts((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleLike = async (id: string) => {
    try {
      await toggleLike(id);
    } catch {
      toast.error("Erreur lors du like");
    }
  };

  const handleClicks = async (id: string) => {
    try {
      await incrementClicks(id);
    } catch {
      // silent - clicks are best-effort
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-primary/10">
          <LayoutGrid className="text-primary" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Mur</h1>
      </div>

      {isLoading ? (
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm text-center">
          <p className="text-muted-foreground">Chargement des publications...</p>
        </div>
      ) : error ? (
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm text-center space-y-3">
          <p className="text-destructive">Erreur lors du chargement des publications.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Réessayer
          </Button>
        </div>
      ) : published.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm text-center">
          <p className="text-muted-foreground">
            {canManage
              ? "Aucune publication publiée pour le moment. Publiez depuis la liste des publications."
              : "Aucune publication pour le moment."}
          </p>
        </div>
      ) : (
        <div className="space-y-6 w-full">
          {published.map((pub) => (
            <PublicationCardWithAI
              key={pub.id}
              publication={pub}
              showAI={isSuperAdmin}
            >
              <div className="space-y-4">
              {/* Author header (LinkedIn-style) */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {(pub.authorName || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-foreground">{pub.authorName}</p>
                  <p className="text-xs text-muted-foreground">
                    Publié le {pub.publishedAt?.toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>

              {/* Content */}
              {pub.text && <p className="whitespace-pre-wrap text-foreground">{pub.text}</p>}

              {/* Tags */}
              {(pub.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(pub.tags ?? []).map((t) => (
                    <HashtagBadge key={t} tag={t} />
                  ))}
                </div>
              )}

              {/* Images + Files */}
              {pub.files.length > 0 && (() => {
                const imageFiles = pub.files.filter((f) => f.type.startsWith("image/"));
                const otherFiles = pub.files.filter((f) => !f.type.startsWith("image/"));
                const previewImages = imageFiles.slice(0, MAX_PREVIEW_IMAGES);
                const hasMoreImages = imageFiles.length > MAX_PREVIEW_IMAGES;
                const extraCount = imageFiles.length - MAX_PREVIEW_IMAGES;

                return (
                  <div className="space-y-3">
                    {/* Image row - 4 horizontal, View all overlay on last when more */}
                    {imageFiles.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 max-w-3xl">
                        {previewImages.map((f, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              handleClicks(pub.id);
                              openGallery(pub, imageFiles, i);
                            }}
                            className="relative aspect-square rounded-xl overflow-hidden border bg-muted group focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <img
                              src={f.url}
                              alt={f.name}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            {hasMoreImages && i === MAX_PREVIEW_IMAGES - 1 && (
                              <div
                                className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 text-white cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleClicks(pub.id);
                                  openGallery(pub, imageFiles, 0);
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <Images size={28} />
                                <span className="text-sm font-medium">Voir tout</span>
                                <span className="text-xs opacity-90">+{extraCount}</span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Non-image files (PDF, etc.) */}
                    {otherFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {otherFiles.map((f, i) => (
                          <button
                            key={i}
                            onClick={() => { if (f.url) { handleClicks(pub.id); window.open(f.url, "_blank"); } }}
                            className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm hover:bg-muted/70 transition-colors"
                          >
                            <FileText size={16} /> {f.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="flex items-center gap-2 border-t border-border pt-3">
                <Button variant="ghost" size="sm" onClick={() => handleLike(pub.id)} className="gap-1.5">
                  <Heart size={16} className={pub.likes > 0 ? "fill-destructive text-destructive" : ""} />
                  {pub.likes > 0 && pub.likes}
                </Button>
                {canManage && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => handleUnpublish(pub.id)} className="gap-1.5 text-muted-foreground">
                      <EyeOff size={16} /> Dépublier
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(pub.id)} className="gap-1.5 text-destructive hover:text-destructive">
                      <Trash2 size={16} /> Supprimer
                    </Button>
                  </>
                )}
              </div>

              {/* Comments */}
              {pub.comments.length > 0 && (
                <div className="space-y-2 border-t border-border pt-3">
                  {pub.comments.map((c) => (
                    <div key={c.id} className="bg-muted rounded-lg px-3 py-2 text-sm">
                      <span className="font-medium text-foreground">{c.author}</span>{" "}
                      <span className="text-muted-foreground">· {c.createdAt.toLocaleDateString("fr-FR")}</span>
                      <p className="mt-0.5">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment */}
              <div className="flex gap-2">
                <Input
                  placeholder="Écrire un commentaire..."
                  value={commentTexts[pub.id] || ""}
                  onChange={(e) => setCommentTexts((prev) => ({ ...prev, [pub.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleComment(pub.id)}
                />
                <Button size="icon" variant="ghost" onClick={() => handleComment(pub.id)}>
                  <Send size={16} />
                </Button>
              </div>
              </div>
            </PublicationCardWithAI>
          ))}
        </div>
      )}

      {/* Image gallery modal with post details */}
      <Dialog open={!!galleryState} onOpenChange={(open) => !open && closeGallery()}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] w-full h-[95vh] p-0 gap-0 border-0 bg-background overflow-hidden [&>button]:text-foreground [&>button]:hover:bg-muted [&>button]:right-2 [&>button]:top-2 z-[100]"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogDescription className="sr-only">
            Galerie d&apos;images de la publication avec possibilité de naviguer et de commenter
          </DialogDescription>
          {galleryState && (() => {
            const pub = published.find((p) => p.id === galleryState.publication.id) ?? galleryState.publication;
            return (
              <div className="flex flex-col md:flex-row h-full">
                {/* Image area */}
                <div className="relative flex-1 flex items-center justify-center min-h-[40vh] md:min-h-0 bg-muted/30">
                  <img
                    src={galleryState.images[galleryState.currentIndex]?.url}
                    alt={galleryState.images[galleryState.currentIndex]?.name ?? "Image"}
                    className="max-h-[50vh] md:max-h-[90vh] max-w-full object-contain"
                  />
                  {galleryState.images.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background border shadow-sm"
                        onClick={goPrev}
                      >
                        <ChevronLeft size={24} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background border shadow-sm"
                        onClick={goNext}
                      >
                        <ChevronRight size={24} />
                      </Button>
                    </>
                  )}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-background/90 text-sm font-medium border shadow-sm">
                    {galleryState.currentIndex + 1} / {galleryState.images.length}
                  </div>
                </div>

                {/* Post details: likes, comments */}
                <div className="w-full md:w-96 flex flex-col border-t md:border-t-0 md:border-l border-border overflow-hidden">
                  <div className="p-4 overflow-y-auto flex-1 space-y-3">
                    {pub.text && <p className="whitespace-pre-wrap text-sm">{pub.text}</p>}
                    {(pub.tags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {(pub.tags ?? []).map((t) => (
                          <HashtagBadge key={t} tag={t} />
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Publié le {pub.publishedAt?.toLocaleDateString("fr-FR")}
                    </p>

                    {/* Likes */}
                    <div className="pt-2 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(pub.id)}
                        className="gap-2 -ml-2"
                      >
                        <Heart size={18} className={pub.likes > 0 ? "fill-destructive text-destructive" : ""} />
                        <span>{pub.likes} j'aime</span>
                      </Button>
                    </div>

                    {/* Comments */}
                    <div className="border-t border-border pt-3">
                      <p className="text-sm font-medium mb-2">Commentaires ({pub.comments.length})</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {pub.comments.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Aucun commentaire.</p>
                        ) : (
                          pub.comments.map((c) => (
                            <div key={c.id} className="bg-muted rounded-lg px-3 py-2 text-sm">
                              <span className="font-medium">{c.author}</span>{" "}
                              <span className="text-muted-foreground text-xs">
                                · {c.createdAt.toLocaleDateString("fr-FR")}
                              </span>
                              <p className="mt-0.5">{c.text}</p>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Input
                          placeholder="Écrire un commentaire..."
                          value={commentTexts[pub.id] || ""}
                          onChange={(e) => setCommentTexts((prev) => ({ ...prev, [pub.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && handleComment(pub.id)}
                          className="flex-1"
                        />
                        <Button size="icon" variant="ghost" onClick={() => handleComment(pub.id)}>
                          <Send size={18} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
