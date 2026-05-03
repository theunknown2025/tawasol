import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarometreDualCharts,
  BAROMETRE_CHART_TYPE_OPTIONS,
  type BarometreChartType,
} from "./BarometreDualCharts";
import { parseBarometreWorkbook } from "./barometreExcelParser";
import { replaceBarometreStatisticsYear } from "./barometreStatisticsApi";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 16 }, (_, i) => currentYear + 2 - i);

export function NouveauBarometreTab() {
  const queryClient = useQueryClient();
  const [year, setYear] = useState<number>(currentYear);
  const [chartType, setChartType] = useState<BarometreChartType>("bar");
  const [previewKind, setPreviewKind] = useState<"region" | "sector">("region");
  const [parsed, setParsed] = useState<ReturnType<typeof parseBarometreWorkbook> | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!parsed) throw new Error("Importez un fichier Excel.");
      if (parsed.regions.length === 0 && parsed.sectors.length === 0) {
        throw new Error("Aucune ligne valide à enregistrer.");
      }
      await replaceBarometreStatisticsYear(year, parsed.regions, parsed.sectors);
    },
    onSuccess: async () => {
      toast.success(`Données ${year} enregistrées.`);
      setParsed(null);
      setFileName(null);
      await queryClient.invalidateQueries({ queryKey: ["barometre-statistics-years"] });
      await queryClient.invalidateQueries({ queryKey: ["barometre-statistics-rows"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setFileName(file.name);
      try {
        const buf = await file.arrayBuffer();
        const result = parseBarometreWorkbook(buf);
        setParsed(result);
        if (result.warnings.length > 0) {
          result.warnings.forEach((w) => toast.warning(w));
        }
        if (result.regions.length === 0 && result.sectors.length === 0) {
          toast.error("Impossible d’extraire des tableaux région / secteur. Vérifiez les en-têtes.");
        } else {
          toast.success("Fichier analysé. Aperçu à droite.");
        }
      } catch {
        toast.error("Lecture du fichier impossible.");
        setParsed(null);
      }
    },
    [],
  );

  const previewRows =
    previewKind === "region"
      ? (parsed?.regions ?? []).map((r) => ({
          categoryLabel: r.categoryLabel,
          cooperatives: r.cooperatives,
          adherents: r.adherents,
        }))
      : (parsed?.sectors ?? []).map((r) => ({
          categoryLabel: r.categoryLabel,
          cooperatives: r.cooperatives,
          adherents: r.adherents,
        }));

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="barometre-year">Année des données</Label>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger id="barometre-year" className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Les données importées remplaceront toute entrée existante pour cette année (régions + secteurs).
          </p>
        </div>

        <div className="space-y-2">
          <Label>Fichier Excel (.xlsx)</Label>
          <p className="text-xs text-muted-foreground">
            Idéalement deux feuilles : répartition par <strong>région</strong> et par <strong>secteur</strong>, avec
            colonnes coopératives et adhérents (comme vos tableaux de référence).
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" className="gap-2" asChild>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4" />
                Choisir un fichier
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="sr-only"
                  onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </Button>
            {fileName ? (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4 shrink-0" />
                <span className="truncate max-w-[200px]">{fileName}</span>
              </span>
            ) : null}
          </div>
        </div>

        {parsed ? (
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground">Résumé import</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                Régions : <strong className="text-foreground">{parsed.regions.length}</strong> lignes
              </li>
              <li>
                Secteurs : <strong className="text-foreground">{parsed.sectors.length}</strong> lignes
              </li>
            </ul>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Type de graphique (aperçu)</Label>
          <Select value={chartType} onValueChange={(v) => setChartType(v as BarometreChartType)}>
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BAROMETRE_CHART_TYPE_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Aperçu : jeu de données</Label>
          <Select value={previewKind} onValueChange={(v) => setPreviewKind(v as "region" | "sector")}>
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="region">Par région</SelectItem>
              <SelectItem value="sector">Par secteur / activité</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          className="w-full sm:w-auto"
          disabled={!parsed || saveMut.isPending || (parsed.regions.length === 0 && parsed.sectors.length === 0)}
          onClick={() => saveMut.mutate()}
        >
          {saveMut.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement…
            </>
          ) : (
            `Enregistrer en base (${year})`
          )}
        </Button>
      </div>

      <div className="min-w-0">
        <p className="mb-3 text-sm font-medium text-muted-foreground">Prévisualisation</p>
        <BarometreDualCharts rows={previewRows} chartType={chartType} />
      </div>
    </div>
  );
}
