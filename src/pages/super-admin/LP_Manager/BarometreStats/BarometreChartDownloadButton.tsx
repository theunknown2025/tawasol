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
};

export function BarometreChartDownloadButton({ fileName, columns, rows, disabled }: Props) {
  const canDownload = !disabled && columns.length > 0 && rows.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={!canDownload}>
          <Download className="mr-2 h-4 w-4" />
          Télécharger les données
        </Button>
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
