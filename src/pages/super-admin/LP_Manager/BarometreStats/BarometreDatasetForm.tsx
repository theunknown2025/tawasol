import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BarometreDataEditor } from "./BarometreDataEditor";
import {
  createBarometreDataset,
  updateBarometreDataset,
} from "./barometreDatasetsApi";
import {
  createEmptyDatasetDraft,
  type BarometreChartStyle,
  type BarometreChartType,
  type BarometreColumn,
  type BarometreDataRow,
  type BarometreDataset,
} from "./barometreDatasetTypes";

type Props = {
  /** If set, form edits this dataset; otherwise creates a new one. */
  initial?: BarometreDataset | null;
  onSaved?: (dataset: BarometreDataset) => void;
  onCancel?: () => void;
};

export function BarometreDatasetForm({ initial = null, onSaved, onCancel }: Props) {
  const queryClient = useQueryClient();
  const draft = createEmptyDatasetDraft();

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [columns, setColumns] = useState<BarometreColumn[]>(initial?.columns ?? draft.columns);
  const [rows, setRows] = useState<BarometreDataRow[]>(initial?.rows ?? draft.rows);
  const [xColumnId, setXColumnId] = useState<string | null>(initial?.x_column_id ?? draft.x_column_id);
  const [yColumnIds, setYColumnIds] = useState<string[]>(initial?.y_column_ids ?? draft.y_column_ids);
  const [chartType, setChartType] = useState<BarometreChartType>(
    initial?.chart_type ?? draft.chart_type,
  );
  const [chartStyle, setChartStyle] = useState<BarometreChartStyle>(
    initial?.chart_style ?? draft.chart_style,
  );

  const saveMut = useMutation({
    mutationFn: async (publish: boolean) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Le nom est obligatoire.");
      if (columns.length === 0) throw new Error("Ajoutez au moins une colonne.");
      if (rows.length === 0) throw new Error("Ajoutez au moins une ligne de données.");

      const payload = {
        name: trimmed,
        description: description.trim(),
        columns,
        rows,
        x_column_id: xColumnId,
        y_column_ids: yColumnIds,
        chart_type: chartType,
        chart_style: chartStyle,
        is_published: publish,
      };

      if (initial?.id) {
        return updateBarometreDataset(initial.id, payload);
      }
      return createBarometreDataset(payload);
    },
    onSuccess: async (dataset, publish) => {
      toast.success(
        publish
          ? chartStyle.isUniversal
            ? "Baromètre publié. Layout appliqué à tous les graphiques."
            : "Baromètre enregistré et publié."
          : chartStyle.isUniversal
            ? "Baromètre enregistré. Layout appliqué à tous les graphiques."
            : "Baromètre enregistré.",
      );
      await queryClient.invalidateQueries({ queryKey: ["barometre-datasets"] });
      await queryClient.invalidateQueries({ queryKey: ["barometre-datasets-published"] });
      onSaved?.(dataset);
      if (!initial) {
        const next = createEmptyDatasetDraft();
        setName("");
        setDescription("");
        setColumns(next.columns);
        setRows(next.rows);
        setXColumnId(next.x_column_id);
        setYColumnIds(next.y_column_ids);
        setChartType(next.chart_type);
        setChartStyle(next.chart_style);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="barometre-name">Nom</Label>
          <Input
            id="barometre-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Coopératives par secteur"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="barometre-desc">Description</Label>
          <Textarea
            id="barometre-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Courte description affichée sur la carte publique"
            rows={3}
          />
        </div>
      </div>

      <BarometreDataEditor
        columns={columns}
        rows={rows}
        xColumnId={xColumnId}
        yColumnIds={yColumnIds}
        chartType={chartType}
        chartStyle={chartStyle}
        onColumnsChange={setColumns}
        onRowsChange={setRows}
        onXColumnIdChange={setXColumnId}
        onYColumnIdsChange={setYColumnIds}
        onChartTypeChange={setChartType}
        onChartStyleChange={setChartStyle}
      />

      <div className="flex flex-wrap gap-3">
        {onCancel ? (
          <Button type="button" variant="ghost" disabled={saveMut.isPending} onClick={onCancel}>
            Annuler
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          disabled={saveMut.isPending}
          onClick={() => saveMut.mutate(initial?.is_published ?? false)}
        >
          {saveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Enregistrer
        </Button>
        <Button type="button" disabled={saveMut.isPending} onClick={() => saveMut.mutate(true)}>
          {saveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Publier
        </Button>
      </div>
    </div>
  );
}
