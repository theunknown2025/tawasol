import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BarometreDataset } from "./barometreDatasetTypes";
import { BarometreDatasetForm } from "./BarometreDatasetForm";

type Props = {
  editing?: BarometreDataset | null;
  onCancelEdit?: () => void;
  onSaved?: (dataset: BarometreDataset) => void;
};

export function NouveauBarometreTab({ editing = null, onCancelEdit, onSaved }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm md:p-6">
      {editing ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Modification
            </p>
            <h2 className="text-lg font-semibold text-foreground">{editing.name}</h2>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onCancelEdit}>
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Nouveau baromètre
          </Button>
        </div>
      ) : null}

      <BarometreDatasetForm
        key={editing?.id ?? "new"}
        initial={editing}
        onSaved={onSaved}
        onCancel={editing ? onCancelEdit : undefined}
      />
    </div>
  );
}
