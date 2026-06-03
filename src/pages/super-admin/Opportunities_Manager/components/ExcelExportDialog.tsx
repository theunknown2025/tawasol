import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GestionFormField } from "@/types/gestionForm";
import type { Opportunity, OpportunityApplication } from "@/types/opportunity";
import {
  APPLICATION_DECISION_LABELS,
  OPPORTUNITY_CONTRACT_TYPE_LABELS,
  OPPORTUNITY_FORMAT_LABELS,
  OPPORTUNITY_TYPE_LABELS,
  formatOpportunityDuration,
} from "@/types/opportunity";

const OPPORTUNITY_COLUMNS = [
  { id: "title", label: "Titre opportunité" },
  { id: "type", label: "Type" },
  { id: "format", label: "Format" },
  { id: "contractType", label: "Type contrat" },
  { id: "duration", label: "Durée" },
  { id: "location", label: "Lieu" },
  { id: "deadline", label: "Date limite" },
  { id: "salary", label: "Salaire (MAD)" },
] as const;

type ExcelExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: Opportunity;
  applications: OpportunityApplication[];
  formFields: GestionFormField[];
};

export default function ExcelExportDialog({
  open,
  onOpenChange,
  opportunity,
  applications,
  formFields,
}: ExcelExportDialogProps) {
  const [selectedOppCols, setSelectedOppCols] = useState<Set<string>>(
    () => new Set(OPPORTUNITY_COLUMNS.map((c) => c.id)),
  );
  const [selectedFormCols, setSelectedFormCols] = useState<Set<string>>(
    () => new Set(formFields.map((f) => f.id)),
  );
  const [includeMeta, setIncludeMeta] = useState(true);

  const formColumns = useMemo(
    () => formFields.map((f) => ({ id: f.id, label: f.label })),
    [formFields],
  );

  const toggle = (set: Set<string>, id: string, checked: boolean) => {
    const next = new Set(set);
    if (checked) next.add(id);
    else next.delete(id);
    return next;
  };

  const handleExport = () => {
    const rows = applications.map((app) => {
      const row: Record<string, string | number> = {};
      if (includeMeta) {
        row["Date candidature"] = new Date(app.createdAt).toLocaleString("fr-FR");
        row["Décision"] = APPLICATION_DECISION_LABELS[app.decision];
        row["Nom candidat"] = app.applicantName;
        row["Email candidat"] = app.applicantEmail;
      }
      if (selectedOppCols.has("title")) row["Titre opportunité"] = opportunity.title;
      if (selectedOppCols.has("type"))
        row["Type"] = OPPORTUNITY_TYPE_LABELS[opportunity.opportunityType];
      if (selectedOppCols.has("format"))
        row["Format"] = OPPORTUNITY_FORMAT_LABELS[opportunity.format];
      if (selectedOppCols.has("contractType"))
        row["Type contrat"] = opportunity.contractType
          ? OPPORTUNITY_CONTRACT_TYPE_LABELS[opportunity.contractType]
          : "";
      if (selectedOppCols.has("duration"))
        row["Durée"] = formatOpportunityDuration(opportunity.durationStart, opportunity.durationEnd);
      if (selectedOppCols.has("location")) row["Lieu"] = opportunity.location;
      if (selectedOppCols.has("deadline"))
        row["Date limite"] = new Date(opportunity.deadline).toLocaleDateString("fr-FR");
      if (selectedOppCols.has("salary"))
        row["Salaire (MAD)"] = opportunity.salaryMad ?? "";
      for (const field of formFields) {
        if (!selectedFormCols.has(field.id)) continue;
        const answer = app.answers[field.id] ?? "";
        const file = app.fileUploads[field.id];
        row[field.label] = file ? `${answer} [Fichier: ${file.fileName}]` : answer;
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidatures");
    XLSX.writeFile(wb, `candidatures-${opportunity.title.slice(0, 30).replace(/\s+/g, "-")}.xlsx`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exporter en Excel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="meta"
              checked={includeMeta}
              onCheckedChange={(c) => setIncludeMeta(c === true)}
            />
            <Label htmlFor="meta">Informations candidature (date, décision, nom, email)</Label>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Informations opportunité</p>
            <div className="space-y-2">
              {OPPORTUNITY_COLUMNS.map((col) => (
                <div key={col.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`opp-${col.id}`}
                    checked={selectedOppCols.has(col.id)}
                    onCheckedChange={(c) =>
                      setSelectedOppCols(toggle(selectedOppCols, col.id, c === true))
                    }
                  />
                  <Label htmlFor={`opp-${col.id}`}>{col.label}</Label>
                </div>
              ))}
            </div>
          </div>
          {formColumns.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Champs du formulaire</p>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {formColumns.map((col) => (
                  <div key={col.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`form-${col.id}`}
                      checked={selectedFormCols.has(col.id)}
                      onCheckedChange={(c) =>
                        setSelectedFormCols(toggle(selectedFormCols, col.id, c === true))
                      }
                    />
                    <Label htmlFor={`form-${col.id}`}>{col.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={handleExport} disabled={applications.length === 0}>
            <Download size={16} className="mr-2" />
            Télécharger
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
