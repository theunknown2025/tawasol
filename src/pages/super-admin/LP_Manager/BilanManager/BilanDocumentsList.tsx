import { useState } from "react";
import { FileText, Loader2, Pencil, Search, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteBilanDocument } from "./deleteBilanDocument";
import type { BilanDocument } from "./types";

const QUERY_KEY = ["lp-bilan-documents"] as const;

function filterBySearch(docs: BilanDocument[], search: string): BilanDocument[] {
  const q = search.trim().toLowerCase();
  if (!q) return docs;
  return docs.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      String(d.year).includes(q),
  );
}

type BilanDocumentsListProps = {
  documents: BilanDocument[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onEdit: (doc: BilanDocument) => void;
};

export function BilanDocumentsList({
  documents,
  isLoading,
  search,
  onSearchChange,
  onEdit,
}: BilanDocumentsListProps) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<BilanDocument | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteBilanDocument,
    onSuccess: () => {
      toast.success("Bilan supprimé");
      void queryClient.invalidateQueries({ queryKey: [...QUERY_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["bilan-highlight"] });
      void queryClient.invalidateQueries({ queryKey: ["public-bilan-documents"] });
      setDeleteTarget(null);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Suppression impossible");
    },
  });

  const filtered = filterBySearch(documents, search);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher par titre, année…"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Aucun bilan pour le moment.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {filtered.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 sm:px-5"
            >
              <div className="flex min-w-0 flex-1 gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="tabular-nums">
                      {doc.year}
                    </Badge>
                    {doc.is_published ? (
                      <Badge className="bg-emerald-600/15 text-emerald-700 hover:bg-emerald-600/15">
                        Publié
                      </Badge>
                    ) : (
                      <Badge variant="outline">Brouillon</Badge>
                    )}
                  </div>
                  <p className="mt-1 font-medium text-foreground">{doc.title}</p>
                  {doc.description.trim() ? (
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                      {doc.description}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                    {doc.click_count ?? 0} clics · {doc.download_count ?? 0} téléchargements
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => onEdit(doc)}>
                  <Pencil className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Modifier</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(doc)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Supprimer</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce bilan ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {deleteTarget?.title} » ({deleteTarget?.year}) sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
