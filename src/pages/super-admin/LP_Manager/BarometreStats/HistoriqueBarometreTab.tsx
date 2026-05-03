import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Loader2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { BarometreDualCharts, BAROMETRE_CHART_TYPE_OPTIONS, type BarometreChartType } from "./BarometreDualCharts";
import type { BarometreBreakdownType } from "./barometreExcelParser";
import {
  fetchBarometreStatisticsForYear,
  fetchBarometreStatisticsYears,
} from "./barometreStatisticsApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function HistoriqueBarometreTab() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<BarometreBreakdownType>("region");
  const [chartType, setChartType] = useState<BarometreChartType>("bar");

  const { data: years = [], isLoading: yearsLoading } = useQuery({
    queryKey: ["barometre-statistics-years"],
    queryFn: fetchBarometreStatisticsYears,
  });

  useEffect(() => {
    if (selectedYear == null && years.length > 0) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  const { data: rows = [], isLoading: rowsLoading } = useQuery({
    queryKey: ["barometre-statistics-rows", selectedYear, breakdown],
    queryFn: () => fetchBarometreStatisticsForYear(selectedYear!, breakdown),
    enabled: selectedYear != null,
  });

  const chartRows = rows.map((r) => ({
    categoryLabel: r.category_label,
    cooperatives: r.cooperatives,
    adherents: r.adherents,
  }));

  if (yearsLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement de l’historique…
      </div>
    );
  }

  if (years.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        Aucune année enregistrée. Utilisez l’onglet « Nouveau Baromètre » pour importer un fichier Excel.
      </p>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[220px,1fr] lg:items-start">
      <aside className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          Années
        </div>
        <ul className="flex flex-col gap-1 border-l-2 border-border pl-3">
          {years.map((y) => (
            <li key={y}>
              <button
                type="button"
                onClick={() => setSelectedYear(y)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                  selectedYear === y
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {y}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="min-w-0 space-y-6">
        {selectedYear != null ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-2">
              <Label>Données affichées</Label>
              <ToggleGroup
                type="single"
                value={breakdown}
                onValueChange={(v) => {
                  if (v === "region" || v === "sector") setBreakdown(v);
                }}
                className="justify-start"
              >
                <ToggleGroupItem value="region" aria-label="Région">
                  Par région
                </ToggleGroupItem>
                <ToggleGroupItem value="sector" aria-label="Secteur">
                  Par secteur / activité
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hist-chart-type">Type de graphique</Label>
              <Select value={chartType} onValueChange={(v) => setChartType(v as BarometreChartType)}>
                <SelectTrigger id="hist-chart-type" className="w-[180px]">
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
          </div>
        ) : null}

        {rowsLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement des données {selectedYear}…
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {selectedYear != null ? (
                <>
                  Année <strong className="text-foreground">{selectedYear}</strong>
                  {breakdown === "region" ? " — répartition par région" : " — répartition par secteur"}
                </>
              ) : null}
            </p>
            <BarometreDualCharts rows={chartRows} chartType={chartType} />
          </>
        )}
      </div>
    </div>
  );
}
