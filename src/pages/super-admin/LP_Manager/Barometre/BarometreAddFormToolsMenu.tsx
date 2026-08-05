import { useState } from "react";
import { Download, Settings2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCoopCsvTemplate } from "./barometreCoopCsv";
import BarometreBulkImportModal from "./BarometreBulkImportModal";

type Props = {
  onImported: () => void;
};

export default function BarometreAddFormToolsMenu({ onImported }: Props) {
  const [bulkOpen, setBulkOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Options d’import / export"
            title="Options d’import / export"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem
            onSelect={() => {
              downloadCoopCsvTemplate();
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Télécharger template base de données
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setBulkOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Téléverser bulk
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BarometreBulkImportModal
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onImported={onImported}
      />
    </>
  );
}
