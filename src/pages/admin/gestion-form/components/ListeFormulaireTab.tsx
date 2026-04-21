import { useState } from "react";
import { Eye, Pencil, SendHorizontal, Trash2, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { GestionForm } from "@/types/gestionForm";
import FormPreviewPanel from "./FormPreviewPanel";

type ListeFormulaireTabProps = {
  forms: GestionForm[];
  onEdit: (form: GestionForm) => void;
  onDelete: (form: GestionForm) => void;
  onPublishToggle: (form: GestionForm) => void;
};

export default function ListeFormulaireTab({
  forms,
  onEdit,
  onDelete,
  onPublishToggle,
}: ListeFormulaireTabProps) {
  const [previewForm, setPreviewForm] = useState<GestionForm | null>(null);

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        {forms.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucun formulaire cree pour le moment.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="w-[110px]">Champs</TableHead>
                <TableHead className="w-[110px]">Date</TableHead>
                <TableHead className="w-[100px]">Statut</TableHead>
                <TableHead className="w-[210px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">{form.title}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-[260px]">
                    <p className="truncate text-sm text-muted-foreground">{form.description || "—"}</p>
                  </TableCell>
                  <TableCell>{form.fields.length}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(form.updatedAt).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={form.status === "published" ? "default" : "secondary"}>
                      {form.status === "published" ? "Publie" : "Brouillon"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Apercu" onClick={() => setPreviewForm(form)}>
                        <Eye size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" title="Modifier" onClick={() => onEdit(form)}>
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Supprimer"
                        className="text-destructive"
                        onClick={() => onDelete(form)}
                      >
                        <Trash2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={form.status === "published" ? "Depublier" : "Publier"}
                        onClick={() => onPublishToggle(form)}
                      >
                        {form.status === "published" ? <EyeOff size={16} /> : <SendHorizontal size={16} />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!previewForm} onOpenChange={() => setPreviewForm(null)}>
        <DialogContent className="w-[95vw] max-w-[95vw] h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apercu du formulaire</DialogTitle>
          </DialogHeader>
          {previewForm && <FormPreviewPanel form={previewForm} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
