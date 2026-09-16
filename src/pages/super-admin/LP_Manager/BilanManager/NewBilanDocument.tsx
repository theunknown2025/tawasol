import { useRef, useState } from "react";
import { FileUp, Loader2, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { uploadLandingPagePdf } from "@/lib/lpLandingPageApi";
import { createBilanDocument } from "./createBilanDocument";
import type { BilanDocumentInsert } from "./types";

const QUERY_KEY = ["lp-bilan-documents"] as const;

const currentYear = new Date().getFullYear();

const emptyForm = (): BilanDocumentInsert => ({
  year: currentYear,
  title: "",
  description: "",
  pdf_url: "",
  is_published: false,
});

type NewBilanDocumentProps = {
  onCreated?: () => void;
};

export function NewBilanDocument({ onCreated }: NewBilanDocumentProps) {
  const queryClient = useQueryClient();
  const pdfRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<BilanDocumentInsert>(emptyForm);
  const [pdfUploading, setPdfUploading] = useState(false);

  const patch = (partial: Partial<BilanDocumentInsert>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const createMutation = useMutation({
    mutationFn: createBilanDocument,
    onSuccess: () => {
      toast.success("Bilan ajouté");
      setForm(emptyForm());
      void queryClient.invalidateQueries({ queryKey: [...QUERY_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["bilan-highlight"] });
      void queryClient.invalidateQueries({ queryKey: ["public-bilan-documents"] });
      onCreated?.();
    },
    onError: (e: Error) => {
      toast.error(e.message || "Impossible d’enregistrer le bilan");
    },
  });

  const handlePdfFile = async (file: File | undefined) => {
    if (!file) return;
    setPdfUploading(true);
    try {
      const { url } = await uploadLandingPagePdf(file, "bilan-remess-documents");
      patch({ pdf_url: url });
      toast.success("Document PDF téléversé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du téléversement PDF");
    } finally {
      setPdfUploading(false);
      if (pdfRef.current) pdfRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      toast.error("Le titre est obligatoire");
      return;
    }
    if (!form.year || form.year < 1990 || form.year > 2100) {
      toast.error("Choisissez une année valide");
      return;
    }
    createMutation.mutate({
      year: form.year,
      title,
      description: form.description.trim(),
      pdf_url: form.pdf_url.trim(),
      is_published: form.is_published,
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Plus className="h-5 w-5 text-primary" aria-hidden />
        Nouveau bilan
      </h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="bilan-year">Année</Label>
          <Input
            id="bilan-year"
            type="number"
            min={1990}
            max={2100}
            value={form.year}
            onChange={(e) => patch({ year: Number(e.target.value) || currentYear })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bilan-title">Titre</Label>
          <Input
            id="bilan-title"
            value={form.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="ex. Bilan d’activité REMESS"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bilan-desc">Description</Label>
          <Textarea
            id="bilan-desc"
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            rows={4}
            placeholder="Résumé court du bilan…"
          />
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-4">
          <Label>Document PDF</Label>
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
            <Label htmlFor="bilan-published" className="text-base">
              Publier sur le site
            </Label>
            <p className="text-xs text-muted-foreground">
              Visible sur la page d’accueil et sur /bilan-remess.
            </p>
          </div>
          <Switch
            id="bilan-published"
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
              Ajouter le bilan
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
