import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BarometreColumn, BarometreDataRow } from "./barometreDatasetTypes";
import {
  downloadBarometreChartDataCsv,
  downloadBarometreChartDataXlsx,
} from "./barometreChartDataDownload";

type Props = {
  fileName: string;
  columns: BarometreColumn[];
  rows: BarometreDataRow[];
  disabled?: boolean;
  /** Affiche uniquement l’icône (tooltip via title / aria-label). */
  iconOnly?: boolean;
};

export function BarometreChartDownloadButton({
  fileName,
  columns,
  rows,
  disabled,
  iconOnly = false,
}: Props) {
  const canDownload = !disabled && columns.length > 0 && rows.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {iconOnly ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!canDownload}
            aria-label="Télécharger les données"
            title="Télécharger les données"
          >
            <Download className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled={!canDownload}>
            <Download className="mr-2 h-4 w-4" />
            Télécharger les données
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            downloadBarometreChartDataXlsx({ fileName, columns, rows })
          }
        >
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => downloadBarometreChartDataCsv({ fileName, columns, rows })}
        >
          CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
