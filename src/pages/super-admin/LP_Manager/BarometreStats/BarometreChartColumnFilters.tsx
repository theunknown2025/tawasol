import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BarometreColumn, BarometreDataRow } from "./barometreDatasetTypes";
import {
  distinctTextValues,
  type BarometreChartFilterState,
} from "./barometreChartFilterUtils";

type Props = {
  columns: BarometreColumn[];
  rows: BarometreDataRow[];
  filters: BarometreChartFilterState;
  onChange: (next: BarometreChartFilterState) => void;
  className?: string;
};

export function BarometreChartColumnFilters({
  columns,
  rows,
  filters,
  onChange,
  className,
}: Props) {
  if (columns.length === 0) return null;

  const setTextValue = (colId: string, value: string, checked: boolean) => {
    const current = filters.textSelected[colId] ?? [];
    const next = checked
      ? [...new Set([...current, value])]
      : current.filter((v) => v !== value);
    onChange({
      ...filters,
      textSelected: { ...filters.textSelected, [colId]: next },
    });
  };

  const setAllText = (colId: string, values: string[], selectAll: boolean) => {
    onChange({
      ...filters,
      textSelected: {
        ...filters.textSelected,
        [colId]: selectAll ? values : [],
      },
    });
  };

  const setNumber = (colId: string, checked: boolean) => {
    onChange({
      ...filters,
      numberEnabled: { ...filters.numberEnabled, [colId]: checked },
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Filtres (toutes les colonnes)
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {columns.map((col) => {
          if (col.type === "text") {
            const values = distinctTextValues(rows, col.id);
            const selected = new Set(filters.textSelected[col.id] ?? []);
            return (
              <div
                key={col.id}
                className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm">{col.label || "Texte"}</Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setAllText(col.id, values, true)}
                    >
                      Tout
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setAllText(col.id, values, false)}
                    >
                      Aucun
                    </Button>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {values.map((v) => (
                    <li key={v}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={selected.has(v)}
                          onCheckedChange={(c) => setTextValue(col.id, v, c === true)}
                        />
                        <span className="truncate">{v}</span>
                      </label>
                    </li>
                  ))}
                  {values.length === 0 ? (
                    <li className="text-xs text-muted-foreground">Aucune valeur</li>
                  ) : null}
                </ul>
              </div>
            );
          }

          return (
            <div key={col.id} className="rounded-lg border border-border p-3">
              <Label className="mb-2 block text-sm">{col.label || "Nombre"}</Label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={filters.numberEnabled[col.id] !== false}
                  onCheckedChange={(c) => setNumber(col.id, c === true)}
                />
                Afficher sur le graphique
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
