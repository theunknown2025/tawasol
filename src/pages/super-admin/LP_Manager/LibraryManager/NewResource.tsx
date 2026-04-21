import { useRef, useState } from "react";
import { FileUp, ImagePlus, Loader2, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { uploadLandingPageImage, uploadLandingPagePdf } from "@/lib/lpLandingPageApi";
import { createLibraryBook } from "./createLibraryBook";
import type { LibraryBookInsert } from "./types";

const QUERY_KEY = ["lp-library-books"] as const;

const emptyForm = (): LibraryBookInsert => ({
  cover_url: "",
  pdf_url: "",
  title: "",
  author: "",
  description: "",
  keywords: "",
  is_published: false,
});

type NewResourceProps = {
  onCreated?: () => void;
};

export function NewResource({ onCreated }: NewResourceProps) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<LibraryBookInsert>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);

  const patch = (partial: Partial<LibraryBookInsert>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const createMutation = useMutation({
    mutationFn: createLibraryBook,
    onSuccess: () => {
      toast.success("Livre ajouté à la bibliothèque");
      setForm(emptyForm());
      void queryClient.invalidateQueries({ queryKey: [...QUERY_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["articles-highlight"] });
      void queryClient.invalidateQueries({ queryKey: ["public-library-books"] });
      onCreated?.();
    },
    onError: (e: Error) => {
      toast.error(e.message || "Impossible d’enregistrer le livre");
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
    if (!title) {
      toast.error("Le titre est obligatoire");
      return;
    }
    createMutation.mutate({
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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Plus className="h-5 w-5 text-primary" aria-hidden />
        Nouvelle ressource
      </h2>
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
              {uploading ? "Téléversement…" : "Choisir une image"}
            </Button>
          </div>
          <Input
            value={form.cover_url}
            onChange={(e) => patch({ cover_url: e.target.value })}
            placeholder="Ou URL de la couverture (https://…)"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="nr-title">Titre</Label>
            <Input
              id="nr-title"
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Titre du livre"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nr-author">Auteur</Label>
            <Input
              id="nr-author"
              value={form.author}
              onChange={(e) => patch({ author: e.target.value })}
              placeholder="Nom de l’auteur"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nr-keywords">Mots-clés (séparés par des virgules)</Label>
            <Input
              id="nr-keywords"
              value={form.keywords}
              onChange={(e) => patch({ keywords: e.target.value })}
              placeholder="ex. développement, Afrique, coopération"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nr-desc">Description</Label>
          <Textarea
            id="nr-desc"
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            rows={4}
            placeholder="Résumé ou présentation du livre…"
          />
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-4">
          <Label>Document PDF (lecture / téléchargement sur le site public)</Label>
          <input
            ref={pdfRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(ev) => void handlePdfFile(ev.target.files?.[0])}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={pdfUploading}
              onClick={() => pdfRef.current?.click()}
            >
              {pdfUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <FileUp className="h-4 w-4" aria-hidden />
              )}
              {pdfUploading ? "Téléversement…" : "Téléverser un PDF"}
            </Button>
          </div>
          <Input
            value={form.pdf_url}
            onChange={(e) => patch({ pdf_url: e.target.value })}
            placeholder="Ou URL du PDF (https://…)"
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
          <div>
            <Label htmlFor="nr-published" className="text-base">
              Publier sur le site
            </Label>
            <p className="text-xs text-muted-foreground">
              Visible dans Articles et sur la page Bibliothèque publique.
            </p>
          </div>
          <Switch
            id="nr-published"
            checked={form.is_published}
            onCheckedChange={(v) => patch({ is_published: v })}
          />
        </div>

        <Button type="submit" disabled={createMutation.isPending} className="gap-2">
          {createMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Enregistrement…
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" aria-hidden />
              Ajouter le livre
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
