import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  inferAxisDefaults,
  newColumnId,
  newRowId,
  type BarometreChartStyle,
  type BarometreChartType,
  type BarometreColumn,
  type BarometreDataRow,
  BAROMETRE_CHART_TYPE_OPTIONS,
} from "./barometreDatasetTypes";
import { BarometreExcelUploadControl } from "./BarometreExcelUploadControl";
import { BarometreChartPanel } from "./BarometreChartPanel";
import { BarometreGestionGraphiqueAccordion } from "./BarometreGestionGraphiqueAccordion";

type Props = {
  columns: BarometreColumn[];
  rows: BarometreDataRow[];
  xColumnId: string | null;
  yColumnIds: string[];
  chartType: BarometreChartType;
  chartStyle: BarometreChartStyle;
  onColumnsChange: (columns: BarometreColumn[]) => void;
  onRowsChange: (rows: BarometreDataRow[]) => void;
  onXColumnIdChange: (id: string | null) => void;
  onYColumnIdsChange: (ids: string[]) => void;
  onChartTypeChange: (t: BarometreChartType) => void;
  onChartStyleChange: (style: BarometreChartStyle) => void;
};

function emptyCells(columns: BarometreColumn[]): Record<string, string | number | null> {
  return Object.fromEntries(columns.map((c) => [c.id, c.type === "number" ? 0 : ""]));
}

export function BarometreDataEditor({
  columns,
  rows,
  xColumnId,
  yColumnIds,
  chartType,
  chartStyle,
  onColumnsChange,
  onRowsChange,
  onXColumnIdChange,
  onYColumnIdsChange,
  onChartTypeChange,
  onChartStyleChange,
}: Props) {
  const addColumn = (type: BarometreColumn["type"]) => {
    const col: BarometreColumn = {
      id: newColumnId(),
      label: type === "number" ? String(new Date().getFullYear()) : "Catégorie",
      type,
    };
    const nextCols = [...columns, col];
    onColumnsChange(nextCols);
    onRowsChange(
      rows.map((r) => ({
        ...r,
        cells: { ...r.cells, [col.id]: type === "number" ? 0 : "" },
      })),
    );
    if (type === "number" && !yColumnIds.includes(col.id)) {
      onYColumnIdsChange([...yColumnIds, col.id]);
    }
    if (type === "text" && !xColumnId) {
      onXColumnIdChange(col.id);
    }
  };

  const updateColumnLabel = (id: string, label: string) => {
    onColumnsChange(columns.map((c) => (c.id === id ? { ...c, label } : c)));
  };

  const updateColumnType = (id: string, type: BarometreColumn["type"]) => {
    const nextCols = columns.map((c) => (c.id === id ? { ...c, type } : c));
    onColumnsChange(nextCols);
    onRowsChange(
      rows.map((r) => ({
        ...r,
        cells: {
          ...r.cells,
          [id]: type === "number" ? Number(r.cells[id]) || 0 : String(r.cells[id] ?? ""),
        },
      })),
    );
    const axes = inferAxisDefaults(nextCols);
    onXColumnIdChange(axes.x_column_id);
    onYColumnIdsChange(axes.y_column_ids);
  };

  const removeColumn = (id: string) => {
    if (columns.length <= 1) return;
    const nextCols = columns.filter((c) => c.id !== id);
    onColumnsChange(nextCols);
    onRowsChange(
      rows.map((r) => {
        const { [id]: _removed, ...cells } = r.cells;
        return { ...r, cells };
      }),
    );
    if (xColumnId === id) {
      onXColumnIdChange(nextCols.find((c) => c.type === "text")?.id ?? nextCols[0]?.id ?? null);
    }
    onYColumnIdsChange(yColumnIds.filter((y) => y !== id));
  };

  const addRow = () => {
    onRowsChange([...rows, { id: newRowId(), cells: emptyCells(columns) }]);
  };

  const updateCell = (rowId: string, colId: string, raw: string, type: BarometreColumn["type"]) => {
    onRowsChange(
      rows.map((r) => {
        if (r.id !== rowId) return r;
        const value =
          type === "number"
            ? raw.trim() === ""
              ? 0
              : Number(raw.replace(/\s/g, "").replace(",", ".")) || 0
            : raw;
        return { ...r, cells: { ...r.cells, [colId]: value } };
      }),
    );
  };

  const toggleTotal = (rowId: string, checked: boolean) => {
    onRowsChange(rows.map((r) => (r.id === rowId ? { ...r, isTotal: checked } : r)));
  };

  const removeRow = (rowId: string) => {
    onRowsChange(rows.filter((r) => r.id !== rowId));
  };

  const toggleY = (colId: string, checked: boolean) => {
    if (checked) onYColumnIdsChange([...new Set([...yColumnIds, colId])]);
    else onYColumnIdsChange(yColumnIds.filter((id) => id !== colId));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="text-base">Données</Label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => addColumn("text")}>
              <Plus className="mr-1 h-4 w-4" />
              Colonne texte
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addColumn("number")}>
              <Plus className="mr-1 h-4 w-4" />
              Colonne nombre
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="mr-1 h-4 w-4" />
              Ligne
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="w-10 px-2 py-2 text-left text-xs font-medium text-muted-foreground">Σ</th>
                {columns.map((col) => (
                  <th key={col.id} className="min-w-[140px] px-2 py-2 align-top">
                    <div className="space-y-1">
                      <Input
                        value={col.label}
                        onChange={(e) => updateColumnLabel(col.id, e.target.value)}
                        className="h-8"
                        aria-label="Nom de colonne"
                      />
                      <div className="flex items-center gap-1">
                        <Select
                          value={col.type}
                          onValueChange={(v) => updateColumnType(col.id, v as BarometreColumn["type"])}
                        >
                          <SelectTrigger className="h-8 flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texte</SelectItem>
                            <SelectItem value="number">Nombre</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-destructive"
                          onClick={() => removeColumn(col.id)}
                          disabled={columns.length <= 1}
                          aria-label="Supprimer la colonne"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </th>
                ))}
                <th className="w-10 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-2 py-1.5">
                    <Checkbox
                      checked={row.isTotal === true}
                      onCheckedChange={(v) => toggleTotal(row.id, v === true)}
                      aria-label="Ligne total"
                    />
                  </td>
                  {columns.map((col) => (
                    <td key={col.id} className="px-2 py-1.5">
                      <Input
                        value={row.cells[col.id] ?? (col.type === "number" ? 0 : "")}
                        onChange={(e) => updateCell(row.id, col.id, e.target.value, col.type)}
                        className="h-8"
                        inputMode={col.type === "number" ? "decimal" : "text"}
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeRow(row.id)}
                      aria-label="Supprimer la ligne"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Cochez Σ pour marquer une ligne « Total » (exclue du graphique).
        </p>

        <BarometreExcelUploadControl columns={columns} onImported={onRowsChange} />
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Label>Axe X</Label>
            <Select
              value={xColumnId ?? undefined}
              onValueChange={(v) => onXColumnIdChange(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Colonne catégories" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label || c.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label>Type de graphique</Label>
            <Select value={chartType} onValueChange={(v) => onChartTypeChange(v as BarometreChartType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BAROMETRE_CHART_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <Label>Axes Y (nombres)</Label>
              <div className="flex flex-col gap-2">
                {columns
                  .filter((c) => c.type === "number")
                  .map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={yColumnIds.includes(c.id)}
                        onCheckedChange={(v) => toggleY(c.id, v === true)}
                      />
                      {c.label || c.id}
                    </label>
                  ))}
                {columns.every((c) => c.type !== "number") ? (
                  <p className="text-xs text-muted-foreground">Ajoutez au moins une colonne nombre.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Aperçu du graphique</Label>
          <div className="max-h-[min(70vh,800px)] overflow-auto rounded-lg border border-border/60 p-2">
            <BarometreChartPanel
              title="Aperçu baromètre"
              columns={columns}
              rows={rows}
              xColumnId={xColumnId}
              yColumnIds={yColumnIds}
              chartType={chartType}
              chartStyle={chartStyle}
              height={chartStyle.chartHeight}
            />
          </div>
        </div>
      </div>

      <BarometreGestionGraphiqueAccordion
        chartStyle={chartStyle}
        onChartStyleChange={onChartStyleChange}
        activeChartType={chartType}
      />
    </div>
  );
}
