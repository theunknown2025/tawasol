import { useEffect, useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
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
import { uploadLandingPagePdf } from "@/lib/lpLandingPageApi";
import { saveBilanDocument } from "./saveBilanDocument";
import type { BilanDocument, BilanDocumentInsert } from "./types";

const QUERY_KEY = ["lp-bilan-documents"] as const;
const currentYear = new Date().getFullYear();

type EditBilanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: BilanDocument | null;
};

export function EditBilanDialog({ open, onOpenChange, document }: EditBilanDialogProps) {
  const queryClient = useQueryClient();
  const pdfRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<BilanDocumentInsert & { id: string }>({
    id: "",
    year: currentYear,
    title: "",
    description: "",
    pdf_url: "",
    is_published: false,
  });
  const [pdfUploading, setPdfUploading] = useState(false);

  useEffect(() => {
    if (!document || !open) return;
    setForm({
      id: document.id,
      year: document.year,
      title: document.title,
      description: document.description,
      pdf_url: document.pdf_url ?? "",
      is_published: document.is_published ?? false,
    });
  }, [document, open]);

  const patch = (partial: Partial<BilanDocumentInsert>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const editMutation = useMutation({
    mutationFn: saveBilanDocument,
    onSuccess: () => {
      toast.success("Bilan mis à jour");
      void queryClient.invalidateQueries({ queryKey: [...QUERY_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["bilan-highlight"] });
      void queryClient.invalidateQueries({ queryKey: ["public-bilan-documents"] });
      onOpenChange(false);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Impossible de mettre à jour le bilan");
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
    editMutation.mutate({
      id: form.id,
      year: form.year,
      title,
      description: form.description.trim(),
      pdf_url: form.pdf_url.trim(),
      is_published: form.is_published,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier le bilan</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="edit-bilan-year">Année</Label>
            <Input
              id="edit-bilan-year"
              type="number"
              min={1990}
              max={2100}
              value={form.year}
              onChange={(e) => patch({ year: Number(e.target.value) || currentYear })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-bilan-title">Titre</Label>
            <Input
              id="edit-bilan-title"
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-bilan-desc">Description</Label>
            <Textarea
              id="edit-bilan-desc"
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={4}
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
            <Input
              value={form.pdf_url}
              onChange={(e) => patch({ pdf_url: e.target.value })}
              placeholder="URL du PDF"
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
            <Label htmlFor="edit-bilan-published">Publier sur le site</Label>
            <Switch
              id="edit-bilan-published"
              checked={form.is_published}
              onCheckedChange={(v) => patch({ is_published: v })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={editMutation.isPending}>
              {editMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
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
