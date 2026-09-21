import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  BarometreChartStyle,
  BarometreChartType,
  BarometreColumn,
  BarometreDataRow,
} from "./barometreDatasetTypes";
import {
  BAROMETRE_CHART_HEIGHT_MAX,
  BAROMETRE_CHART_HEIGHT_MIN,
  BAROMETRE_CHART_TYPE_OPTIONS,
  clampChartHeight,
  createDefaultChartStyle,
  resolveXFilterLegendColor,
} from "./barometreDatasetTypes";
import { BarometreFlexibleChart } from "./BarometreFlexibleChart";

type Props = {
  chartStyle: BarometreChartStyle;
  onChartStyleChange: (next: BarometreChartStyle) => void;
  /** Chart type of the dataset being edited — preview defaults to this. */
  activeChartType: BarometreChartType;
  className?: string;
};

/** Fixed mock dataset (≥ 5 rows) so style edits are visible without real data. */
const MOCK_COLUMNS: BarometreColumn[] = [
  { id: "mock-x", label: "Région", type: "text" },
  { id: "mock-y1", label: "2023", type: "number" },
  { id: "mock-y2", label: "2024", type: "number" },
  { id: "mock-y3", label: "2025", type: "number" },
];

const MOCK_ROWS: BarometreDataRow[] = [
  { id: "mock-r1", cells: { "mock-x": "Nord", "mock-y1": 38, "mock-y2": 42, "mock-y3": 55 } },
  { id: "mock-r2", cells: { "mock-x": "Centre", "mock-y1": 61, "mock-y2": 68, "mock-y3": 61 } },
  { id: "mock-r3", cells: { "mock-x": "Sud", "mock-y1": 28, "mock-y2": 35, "mock-y3": 48 } },
  { id: "mock-r4", cells: { "mock-x": "Est", "mock-y1": 44, "mock-y2": 51, "mock-y3": 70 } },
  { id: "mock-r5", cells: { "mock-x": "Ouest", "mock-y1": 22, "mock-y2": 29, "mock-y3": 38 } },
  { id: "mock-r6", cells: { "mock-x": "Atlas", "mock-y1": 33, "mock-y2": 41, "mock-y3": 47 } },
];

const MOCK = {
  columns: MOCK_COLUMNS,
  rows: MOCK_ROWS,
  xColumnId: "mock-x",
  yColumnIds: ["mock-y1", "mock-y2", "mock-y3"],
};

const MOCK_FILTER_LABELS = MOCK_ROWS.map((r) => String(r.cells["mock-x"]));

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const pickerValue = /^#[0-9A-Fa-f]{6}$/.test(value.trim()) ? value.trim() : "#64748b";
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-11 cursor-pointer rounded border border-border bg-transparent p-0.5"
          aria-label={label}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 font-mono text-xs"
          placeholder="#ffffff"
        />
      </div>
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  min = 8,
  max = 24,
  step = 1,
  suffix,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) return;
            onChange(Math.min(max, Math.max(min, Math.round(n))));
          }}
          className="h-9"
        />
        {suffix ? <span className="shrink-0 text-xs text-muted-foreground">{suffix}</span> : null}
      </div>
    </div>
  );
}

export function BarometreGestionGraphiqueAccordion({
  chartStyle,
  onChartStyleChange,
  activeChartType,
  className,
}: Props) {
  const [previewType, setPreviewType] = useState<BarometreChartType>(activeChartType);

  useEffect(() => {
    setPreviewType(activeChartType);
  }, [activeChartType]);

  const patch = (partial: Partial<BarometreChartStyle>) => {
    onChartStyleChange({ ...chartStyle, ...partial });
  };

  const resetStyle = () => {
    onChartStyleChange({
      ...createDefaultChartStyle(),
      isUniversal: chartStyle.isUniversal,
    });
  };

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="gestion-graphique"
      className={cn("rounded-xl border border-border bg-card", className)}
    >
      <AccordionItem value="gestion-graphique" className="border-0">
        <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
          Gestion Graphique
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="grid gap-6 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
            <div className="space-y-5">
              <ColorField
                id="chart-bg"
                label="Fond du graphique"
                value={chartStyle.backgroundColor}
                onChange={(backgroundColor) => patch({ backgroundColor })}
              />

              <div className="space-y-3 rounded-lg border border-border/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Hauteur du graphique
                </p>
                <NumberField
                  id="chart-height"
                  label={`Hauteur (${BAROMETRE_CHART_HEIGHT_MIN}–${BAROMETRE_CHART_HEIGHT_MAX} px)`}
                  value={chartStyle.chartHeight}
                  min={BAROMETRE_CHART_HEIGHT_MIN}
                  max={BAROMETRE_CHART_HEIGHT_MAX}
                  step={20}
                  suffix="px"
                  onChange={(chartHeight) => patch({ chartHeight: clampChartHeight(chartHeight) })}
                />
                <input
                  type="range"
                  min={BAROMETRE_CHART_HEIGHT_MIN}
                  max={BAROMETRE_CHART_HEIGHT_MAX}
                  step={20}
                  value={chartStyle.chartHeight}
                  onChange={(e) =>
                    patch({ chartHeight: clampChartHeight(Number(e.target.value)) })
                  }
                  className="w-full accent-primary"
                  aria-label="Hauteur du graphique"
                />
              </div>

              <div className="space-y-3 rounded-lg border border-border/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Police axe X
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    id="x-font-size"
                    label="Taille"
                    value={chartStyle.xAxisFontSize}
                    onChange={(xAxisFontSize) => patch({ xAxisFontSize })}
                  />
                  <ColorField
                    id="x-font-color"
                    label="Couleur"
                    value={chartStyle.xAxisFontColor}
                    onChange={(xAxisFontColor) => patch({ xAxisFontColor })}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-border/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Police axe Y
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    id="y-font-size"
                    label="Taille"
                    value={chartStyle.yAxisFontSize}
                    onChange={(yAxisFontSize) => patch({ yAxisFontSize })}
                  />
                  <ColorField
                    id="y-font-color"
                    label="Couleur"
                    value={chartStyle.yAxisFontColor}
                    onChange={(yAxisFontColor) => patch({ yAxisFontColor })}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-border/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Couleurs des légendes filtres (axe X)
                </p>
                <div className="space-y-1.5">
                  <Label>Mode</Label>
                  <Select
                    value={chartStyle.xFilterColorMode}
                    onValueChange={(v) =>
                      patch({ xFilterColorMode: v === "unique" ? "unique" : "multiple" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple">Couleurs multiples (une par filtre)</SelectItem>
                      <SelectItem value="unique">Couleur unique (tous les filtres)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Appliqué aux légendes des filtres X sur la page publique — sans choix manuel des
                  couleurs.
                </p>
                <ul className="flex flex-wrap gap-2 pt-1">
                  {MOCK_FILTER_LABELS.map((label, i) => (
                    <li
                      key={label}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border/70 px-2 py-1 text-xs"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: resolveXFilterLegendColor(
                            chartStyle.xFilterColorMode,
                            i,
                          ),
                        }}
                        aria-hidden
                      />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 rounded-lg border border-border/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Texte au survol
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    id="tip-font-size"
                    label="Taille"
                    value={chartStyle.tooltipFontSize}
                    onChange={(tooltipFontSize) => patch({ tooltipFontSize })}
                  />
                  <ColorField
                    id="tip-font-color"
                    label="Couleur"
                    value={chartStyle.tooltipFontColor}
                    onChange={(tooltipFontColor) => patch({ tooltipFontColor })}
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/70 p-3 text-sm">
                <Checkbox
                  checked={chartStyle.isUniversal}
                  onCheckedChange={(c) => patch({ isUniversal: c === true })}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Mise en page universelle</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Appliquer ce layout à tous les graphiques baromètre à l’enregistrement.
                  </span>
                </span>
              </label>

              <Button type="button" variant="ghost" size="sm" onClick={resetStyle}>
                Réinitialiser le style
              </Button>
            </div>

            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Aperçu (données fictives — {MOCK.rows.length} lignes)
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Hauteur du graphique :{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      {chartStyle.chartHeight} px
                    </span>
                  </p>
                </div>
                <div className="w-full max-w-[200px] space-y-1.5">
                  <Label htmlFor="preview-chart-type">Type de graphique</Label>
                  <Select
                    value={previewType}
                    onValueChange={(v) => setPreviewType(v as BarometreChartType)}
                  >
                    <SelectTrigger id="preview-chart-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BAROMETRE_CHART_TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                          {o.value === activeChartType ? " (actif)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="max-h-[min(80vh,900px)] overflow-auto rounded-lg border border-border/70 p-3">
                <BarometreFlexibleChart
                  key={`preview-${previewType}-${chartStyle.chartHeight}`}
                  columns={MOCK.columns}
                  rows={MOCK.rows}
                  xColumnId={MOCK.xColumnId}
                  yColumnIds={MOCK.yColumnIds}
                  chartType={previewType}
                  chartStyle={chartStyle}
                  height={chartStyle.chartHeight}
                />
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
