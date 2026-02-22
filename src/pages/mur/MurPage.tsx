import { useState } from "react";
import { LayoutGrid, Heart, MessageCircle, Trash2, EyeOff, Send, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePublications } from "@/hooks/usePublications";
import { updatePublication, deletePublication, toggleLike, addComment, incrementClicks } from "@/stores/publicationsStore";

export default function MurPage() {
  const publications = usePublications();
  const published = publications.filter((p) => p.status === "published");
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  const handleUnpublish = (id: string) => {
    updatePublication(id, { status: "draft", publishedAt: undefined });
  };

  const handleDelete = (id: string) => {
    deletePublication(id);
  };

  const handleComment = (id: string) => {
    const text = commentTexts[id]?.trim();
    if (!text) return;
    addComment(id, text);
    setCommentTexts((prev) => ({ ...prev, [id]: "" }));
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-primary/10">
          <LayoutGrid className="text-primary" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Mur</h1>
      </div>

      {published.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm text-center">
          <p className="text-muted-foreground">Aucune publication pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-6 w-full">
          {published.map((pub) => (
            <div key={pub.id} className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              {/* Content */}
              {pub.text && <p className="whitespace-pre-wrap text-foreground">{pub.text}</p>}

              {/* Files */}
              {pub.files.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {pub.files.map((f, i) =>
                    f.type.startsWith("image/") ? (
                      <img
                        key={i}
                        src={f.url}
                        alt={f.name}
                        className="w-full max-w-md rounded-xl object-cover border cursor-pointer"
                        onClick={() => { incrementClicks(pub.id); window.open(f.url, "_blank"); }}
                      />
                    ) : (
                      <button
                        key={i}
                        onClick={() => { incrementClicks(pub.id); window.open(f.url, "_blank"); }}
                        className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm hover:bg-muted/70 transition-colors"
                      >
                        <FileText size={16} /> {f.name}
                      </button>
                    )
                  )}
                </div>
              )}

              {/* Meta */}
              <p className="text-xs text-muted-foreground">
                Publié le {pub.publishedAt?.toLocaleDateString("fr-FR")}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 border-t border-border pt-3">
                <Button variant="ghost" size="sm" onClick={() => toggleLike(pub.id)} className="gap-1.5">
                  <Heart size={16} className={pub.likes > 0 ? "fill-destructive text-destructive" : ""} />
                  {pub.likes > 0 && pub.likes}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleUnpublish(pub.id)} className="gap-1.5 text-muted-foreground">
                  <EyeOff size={16} /> Dépublier
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(pub.id)} className="gap-1.5 text-destructive hover:text-destructive">
                  <Trash2 size={16} /> Supprimer
                </Button>
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
          ))}
        </div>
      )}
    </div>
  );
}
