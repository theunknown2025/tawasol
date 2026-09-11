import { useId, useRef, useState } from "react";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { parseBarometreDatasetExcel } from "./barometreDatasetExcelImport";
import type { BarometreColumn, BarometreDataRow } from "./barometreDatasetTypes";

type Props = {
  columns: BarometreColumn[];
  onImported: (rows: BarometreDataRow[]) => void;
  disabled?: boolean;
};

export function BarometreExcelUploadControl({ columns, onImported, disabled }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const ready = columns.length > 0 && columns.every((c) => c.label.trim().length > 0);

  const onPick = async (file: File | null) => {
    if (!file) return;
    if (!ready) {
      toast.error("Nommez toutes les colonnes avant d’importer un Excel.");
      return;
    }
    setBusy(true);
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const result = parseBarometreDatasetExcel(buf, columns);
      onImported(result.rows);
      result.warnings.forEach((w) => toast.warning(w));
      toast.success(`${result.rows.length} ligne(s) importée(s) depuis Excel.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import Excel impossible.");
      setFileName(null);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/20 p-4">
      <Label htmlFor={inputId} className="text-sm font-medium">
        Importer les données (Excel)
      </Label>
      <p className="text-xs text-muted-foreground">
        Après avoir défini les colonnes et leur type, importez un fichier dont la première ligne
        d’en-têtes reprend exactement les mêmes libellés (ex. Secteur, 2020, 2021…).
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="sr-only"
          disabled={disabled || busy || !ready}
          onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || busy || !ready}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Choisir un fichier Excel
        </Button>
        {fileName ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden />
            {fileName}
          </span>
        ) : null}
      </div>
      {!ready ? (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Ajoutez et nommez chaque colonne (texte / nombre) avant l’import.
        </p>
      ) : null}
    </div>
  );
}
