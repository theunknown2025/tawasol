import type { ComponentType } from "react";
import { Calendar, MapPin, Banknote, Clock, Briefcase, FileText, Download, Monitor, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  OPPORTUNITY_CONTRACT_TYPE_LABELS,
  OPPORTUNITY_FORMAT_LABELS,
  OPPORTUNITY_TYPE_LABELS,
  formatOpportunityDuration,
  type Opportunity,
} from "@/types/opportunity";

type OpportunityDetailSidebarProps = {
  opportunity: Opportunity;
  canApply: boolean;
  onApply: () => void;
};

function CriteriaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function OpportunityDetailSidebar({
  opportunity,
  canApply,
  onApply,
}: OpportunityDetailSidebarProps) {
  const deadlineLabel = new Date(opportunity.deadline).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const durationLabel = formatOpportunityDuration(opportunity.durationStart, opportunity.durationEnd);

  return (
    <aside className="space-y-4 lg:sticky lg:top-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">Informations</h2>
        <div className="space-y-4">
          <CriteriaRow
            icon={Briefcase}
            label="Type"
            value={OPPORTUNITY_TYPE_LABELS[opportunity.opportunityType]}
          />
          <CriteriaRow
            icon={MapPin}
            label="Lieu"
            value={opportunity.location || "—"}
          />
          <CriteriaRow
            icon={Calendar}
            label="Date limite"
            value={deadlineLabel}
          />
          <CriteriaRow
            icon={Monitor}
            label="Format"
            value={OPPORTUNITY_FORMAT_LABELS[opportunity.format]}
          />
          {opportunity.contractType && (
            <CriteriaRow
              icon={ScrollText}
              label="Type de contrat"
              value={OPPORTUNITY_CONTRACT_TYPE_LABELS[opportunity.contractType]}
            />
          )}
          {(opportunity.durationStart || opportunity.durationEnd) && (
            <CriteriaRow icon={Clock} label="Durée" value={durationLabel} />
          )}
          {opportunity.salaryMad != null && opportunity.salaryMad > 0 && (
            <CriteriaRow
              icon={Banknote}
              label="Salaire"
              value={`${opportunity.salaryMad.toLocaleString("fr-FR")} MAD`}
            />
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
          <FileText size={18} className="text-emerald-600 dark:text-emerald-400" />
          Documents
        </h2>
        {opportunity.documents.length > 0 ? (
          <ul className="space-y-2">
            {opportunity.documents.map((doc) => (
              <li key={doc.id}>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm font-medium text-primary transition hover:border-emerald-500/40 hover:bg-emerald-500/5"
                >
                  <Download size={16} className="shrink-0" />
                  <span className="min-w-0 truncate">{doc.label}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun document disponible.</p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        {canApply ? (
          <Button className="w-full" size="lg" onClick={onApply}>
            Postuler à cette opportunité
          </Button>
        ) : (
          <p className="text-center text-sm text-muted-foreground">Inscription non disponible.</p>
        )}
      </div>
    </aside>
  );
}
