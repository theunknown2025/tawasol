import { useState } from "react";
import { Expand, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { BarometreDataset } from "@/pages/super-admin/LP_Manager/BarometreStats/barometreDatasetTypes";
import { BarometreFlexibleChart } from "@/pages/super-admin/LP_Manager/BarometreStats/BarometreFlexibleChart";
import { BarometreChartPanel } from "@/pages/super-admin/LP_Manager/BarometreStats/BarometreChartPanel";

type Props = {
  dataset: BarometreDataset;
  className?: string;
  /** Compact card for landing carousel. */
  compact?: boolean;
};

export function BarometreChartCard({ dataset, className, compact = false }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <article
        className={cn(
          "flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm",
          className,
        )}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground">{dataset.name}</h3>
            {dataset.description ? (
              <p
                className={cn(
                  "mt-1 text-sm text-muted-foreground",
                  compact ? "line-clamp-2" : "line-clamp-3",
                )}
              >
                {dataset.description}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setOpen(true)}
            aria-label={`Agrandir ${dataset.name}`}
          >
            {compact ? <Expand className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
        <BarometreFlexibleChart
          columns={dataset.columns}
          rows={dataset.rows}
          xColumnId={dataset.x_column_id}
          yColumnIds={dataset.y_column_ids}
          chartType={dataset.chart_type}
          height={compact ? 160 : 220}
        />
      </article>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dataset.name}</DialogTitle>
            {dataset.description ? (
              <DialogDescription>{dataset.description}</DialogDescription>
            ) : null}
          </DialogHeader>
          <BarometreChartPanel
            title={dataset.name}
            columns={dataset.columns}
            rows={dataset.rows}
            xColumnId={dataset.x_column_id}
            yColumnIds={dataset.y_column_ids}
            chartType={dataset.chart_type}
            height={420}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
