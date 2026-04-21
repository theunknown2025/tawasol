import { useEffect, useRef, useState } from "react";
import { FileUp, ImagePlus, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { uploadLandingPageImage, uploadLandingPagePdf } from "@/lib/lpLandingPageApi";
import { saveLibraryBook } from "./saveLibraryBook";
import type { LibraryBook, LibraryBookInsert } from "./types";

const QUERY_KEY = ["lp-library-books"] as const;

type EditResourceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: LibraryBook | null;
};

export function EditResourceDialog({ open, onOpenChange, book }: EditResourceDialogProps) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<LibraryBookInsert & { id: string }>({
    id: "",
    cover_url: "",
    pdf_url: "",
    title: "",
    author: "",
    description: "",
    keywords: "",
    is_published: false,
  });
  const [uploading, setUploading] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);

  useEffect(() => {
    if (!book || !open) return;
    setForm({
      id: book.id,
      cover_url: book.cover_url,
      pdf_url: book.pdf_url ?? "",
      title: book.title,
      author: book.author,
      description: book.description,
      keywords: book.keywords,
      is_published: book.is_published ?? false,
    });
  }, [book, open]);

  const patch = (partial: Partial<LibraryBookInsert>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const editMutation = useMutation({
    mutationFn: saveLibraryBook,
    onSuccess: () => {
      toast.success("Livre mis à jour");
      void queryClient.invalidateQueries({ queryKey: [...QUERY_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["articles-highlight"] });
      void queryClient.invalidateQueries({ queryKey: ["public-library-books"] });
      onOpenChange(false);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Impossible d’enregistrer les modifications");
    },
  });

  const handleCoverFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url, usedFallback } = await uploadLandingPageImage(file, "library-covers");
      patch({ cover_url: url });
      if (usedFallback) {
        toast.warning("Couverture en local", {
          description: "Le stockage distant n’est pas disponible : image intégrée pour cette session.",
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du téléversement");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title || !form.id) {
      toast.error("Le titre est obligatoire");
      return;
    }
    editMutation.mutate({
      id: form.id,
      cover_url: form.cover_url.trim(),
      pdf_url: form.pdf_url.trim(),
      title,
      author: form.author.trim(),
      description: form.description.trim(),
      keywords: form.keywords.trim(),
      is_published: form.is_published,
    });
  };

  const handlePdfFile = async (file: File | undefined) => {
    if (!file) return;
    setPdfUploading(true);
    try {
      const { url } = await uploadLandingPagePdf(file, "library-documents");
      patch({ pdf_url: url });
      toast.success("Document PDF téléversé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du téléversement PDF");
    } finally {
      setPdfUploading(false);
      if (pdfRef.current) pdfRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier la ressource</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Couverture</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(ev) => void handleCoverFile(ev.target.files?.[0])}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <ImagePlus className="h-4 w-4" aria-hidden />
                )}
                {uploading ? "Téléversement…" : "Changer l’image"}
              </Button>
            </div>
            <Input
              value={form.cover_url}
              onChange={(e) => patch({ cover_url: e.target.value })}
              placeholder="URL de la couverture"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="er-title">Titre</Label>
            <Input
              id="er-title"
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="er-author">Auteur</Label>
            <Input
              id="er-author"
              value={form.author}
              onChange={(e) => patch({ author: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="er-keywords">Mots-clés (virgules)</Label>
            <Input
              id="er-keywords"
              value={form.keywords}
              onChange={(e) => patch({ keywords: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="er-desc">Description</Label>
            <Textarea
              id="er-desc"
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
            <Label>Document PDF</Label>
            <input
              ref={pdfRef}
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(ev) => void handlePdfFile(ev.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mb-2 gap-2"
              disabled={pdfUploading}
              onClick={() => pdfRef.current?.click()}
            >
              {pdfUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <FileUp className="h-4 w-4" aria-hidden />
              )}
              {pdfUploading ? "Téléversement…" : "Changer le PDF"}
            </Button>
            <Input
              value={form.pdf_url}
              onChange={(e) => patch({ pdf_url: e.target.value })}
              placeholder="URL du PDF"
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2">
            <Label htmlFor="er-published">Publier sur le site</Label>
            <Switch
              id="er-published"
              checked={form.is_published}
              onCheckedChange={(v) => patch({ is_published: v })}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={editMutation.isPending} className="gap-2">
              {editMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Enregistrement…
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
