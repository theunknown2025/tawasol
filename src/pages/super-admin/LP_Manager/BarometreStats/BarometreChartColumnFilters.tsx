import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type {
  BarometreColumn,
  BarometreDataRow,
  BarometreXFilterColorMode,
} from "./barometreDatasetTypes";
import { resolveXFilterLegendColor } from "./barometreDatasetTypes";
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
  /**
   * `grid` — cartes en grille (éditeur / dialogue).
   * `aside` — colonnes en accordéons à droite du graphique.
   */
  variant?: "grid" | "aside";
  /** Color mode for X (text) filter legends. */
  xFilterColorMode?: BarometreXFilterColorMode;
};

function FilterValueLabel({
  label,
  color,
}: {
  label: string;
  color: string | null;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {color ? (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
      ) : null}
      <span className="break-words">{label}</span>
    </span>
  );
}

export function BarometreChartColumnFilters({
  columns,
  rows,
  filters,
  onChange,
  className,
  variant = "grid",
  xFilterColorMode = "multiple",
}: Props) {
  if (columns.length === 0) return null;

  const legendColor = (index: number) =>
    resolveXFilterLegendColor(xFilterColorMode, index);

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

  if (variant === "aside") {
    const defaultOpen = columns
      .filter((col) => {
        if (col.type !== "text") return false;
        return distinctTextValues(rows, col.id).length > 1;
      })
      .slice(0, 1)
      .map((col) => col.id);

    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Filtres
        </p>
        <Accordion type="multiple" defaultValue={defaultOpen} className="w-full">
          {columns.map((col) => {
            if (col.type === "text") {
              const values = distinctTextValues(rows, col.id);
              const selected = new Set(filters.textSelected[col.id] ?? []);
              const useAccordion = values.length > 1;

              if (!useAccordion) {
                return (
                  <div
                    key={col.id}
                    className="border-b border-border/70 px-1 py-3 last:border-b-0"
                  >
                    <Label className="mb-2 block text-sm font-medium">
                      {col.label || "Texte"}
                    </Label>
                    {values.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Aucune valeur</p>
                    ) : (
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={selected.has(values[0]!)}
                          onCheckedChange={(c) =>
                            setTextValue(col.id, values[0]!, c === true)
                          }
                        />
                        <FilterValueLabel
                          label={values[0]!}
                          color={legendColor(0)}
                        />
                      </label>
                    )}
                  </div>
                );
              }

              return (
                <AccordionItem key={col.id} value={col.id} className="border-border/70">
                  <AccordionTrigger className="py-3 text-left text-sm font-medium hover:no-underline">
                    <span className="flex min-w-0 flex-1 items-center gap-2 pr-2">
                      <span className="truncate">{col.label || "Texte"}</span>
                      <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                        {selected.size}/{values.length}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="mb-2 flex items-center justify-end gap-1">
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
                    <ul className="max-h-52 space-y-2 overflow-y-auto pr-1">
                      {values.map((v, i) => (
                        <li key={v}>
                          <label className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
                            <Checkbox
                              className="mt-0.5"
                              checked={selected.has(v)}
                              onCheckedChange={(c) =>
                                setTextValue(col.id, v, c === true)
                              }
                            />
                            <FilterValueLabel label={v} color={legendColor(i)} />
                          </label>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            }

            return (
              <div
                key={col.id}
                className="border-b border-border/70 px-1 py-3 last:border-b-0"
              >
                <Label className="mb-2 block text-sm font-medium">
                  {col.label || "Nombre"}
                </Label>
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
        </Accordion>
      </div>
    );
  }

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
                  {values.map((v, i) => (
                    <li key={v}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={selected.has(v)}
                          onCheckedChange={(c) => setTextValue(col.id, v, c === true)}
                        />
                        <FilterValueLabel label={v} color={legendColor(i)} />
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
