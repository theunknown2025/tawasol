import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { insertBarometreCooperativesBulk } from "./barometreCooperativesApi";
import { parseCoopCsvFile, type CoopCsvPreviewRow } from "./barometreCoopCsv";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
};

export default function BarometreBulkImportModal({ open, onOpenChange, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<CoopCsvPreviewRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const validCount = preview.filter((r) => r.payload != null).length;
  const errorCount = preview.filter((r) => r.errors.length > 0).length;

  const reset = () => {
    setFileName(null);
    setPreview([]);
    setParseError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const onFileChange = async (file: File | null) => {
    if (!file) {
      reset();
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      toast.error("Veuillez choisir un fichier CSV.");
      return;
    }
    try {
      const text = await file.text();
      const { preview: rows, parseError: err } = parseCoopCsvFile(text);
      setFileName(file.name);
      setParseError(err);
      setPreview(rows);
      if (err) toast.error(err);
    } catch {
      toast.error("Lecture du fichier impossible.");
      reset();
    }
  };

  const onSubmit = async () => {
    const payloads = preview.map((r) => r.payload).filter((p): p is NonNullable<typeof p> => p != null);
    if (payloads.length === 0) {
      toast.error("Aucune ligne valide à enregistrer.");
      return;
    }
    if (errorCount > 0) {
      toast.error("Corrigez les lignes en erreur ou retirez-les du CSV avant d’enregistrer.");
      return;
    }

    setIsSaving(true);
    try {
      const n = await insertBarometreCooperativesBulk(payloads);
      toast.success(`${n} coopérative${n > 1 ? "s" : ""} enregistrée${n > 1 ? "s" : ""}.`);
      handleOpenChange(false);
      onImported();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import impossible.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col gap-4 overflow-hidden">
        <DialogHeader>
          <DialogTitle>Téléverser bulk — coopératives</DialogTitle>
          <DialogDescription>
            Importez un CSV (template recommandé). Vérifiez le tableau ci-dessous avant
            d&apos;enregistrer. Les lignes en erreur bloquent l&apos;import.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
          />
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Choisir un CSV
          </Button>
          {fileName ? (
            <span className="text-sm text-muted-foreground truncate max-w-[240px]">{fileName}</span>
          ) : null}
          {preview.length > 0 ? (
            <span className="text-xs text-muted-foreground">
              {validCount} valide{validCount > 1 ? "s" : ""}
              {errorCount > 0 ? ` · ${errorCount} erreur${errorCount > 1 ? "s" : ""}` : ""}
            </span>
          ) : null}
        </div>

        {parseError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {parseError}
          </p>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border">
          {preview.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Aucune donnée à prévisualiser. Choisissez un fichier CSV.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky top-0 bg-background">Ligne</TableHead>
                  <TableHead className="sticky top-0 bg-background">Nom</TableHead>
                  <TableHead className="sticky top-0 bg-background hidden lg:table-cell">Tél</TableHead>
                  <TableHead className="sticky top-0 bg-background hidden lg:table-cell">
                    Email
                  </TableHead>
                  <TableHead className="sticky top-0 bg-background hidden xl:table-cell">
                    Localisation
                  </TableHead>
                  <TableHead className="sticky top-0 bg-background">Secteur</TableHead>
                  <TableHead className="sticky top-0 bg-background hidden md:table-cell">
                    Sous-secteur
                  </TableHead>
                  <TableHead className="sticky top-0 bg-background">Publier</TableHead>
                  <TableHead className="sticky top-0 bg-background">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((row) => {
                  const hasErr = row.errors.length > 0;
                  return (
                    <TableRow
                      key={row.rowIndex}
                      className={cn(hasErr && "bg-destructive/5")}
                    >
                      <TableCell className="font-mono text-xs">{row.rowIndex}</TableCell>
                      <TableCell className="max-w-[140px] truncate font-medium">
                        {row.display.nom || "—"}
                      </TableCell>
                      <TableCell className="hidden max-w-[100px] truncate text-xs lg:table-cell">
                        {row.display.telephones || "—"}
                      </TableCell>
                      <TableCell className="hidden max-w-[120px] truncate text-xs lg:table-cell">
                        {row.display.email || "—"}
                      </TableCell>
                      <TableCell className="hidden max-w-[140px] truncate text-xs xl:table-cell">
                        {[row.display.commune, row.display.province].filter(Boolean).join(", ") ||
                          (row.display.longitude && row.display.latitude
                            ? `${row.display.longitude}, ${row.display.latitude}`
                            : "—")}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-sm">
                        {row.display.secteur || "—"}
                      </TableCell>
                      <TableCell className="hidden max-w-[100px] truncate text-sm md:table-cell">
                        {row.display.sousSecteur || "—"}
                      </TableCell>
                      <TableCell className="text-xs">{row.display.publier}</TableCell>
                      <TableCell className="min-w-[140px] text-xs">
                        {hasErr ? (
                          <ul className="list-disc space-y-0.5 pl-3 text-destructive">
                            {row.errors.map((e) => (
                              <li key={e}>{e}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400">OK</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            disabled={isSaving || validCount === 0 || errorCount > 0}
            onClick={() => void onSubmit()}
          >
            {isSaving
              ? "Enregistrement…"
              : `Enregistrer ${validCount > 0 ? `(${validCount})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
