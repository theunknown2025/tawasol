import { MapPin, Calendar, Banknote, Clock } from "lucide-react";
import {
  OPPORTUNITY_CONTRACT_TYPE_LABELS,
  OPPORTUNITY_FORMAT_LABELS,
  OPPORTUNITY_TYPE_LABELS,
  formatOpportunityDuration,
  type OpportunityContractType,
  type OpportunityFormat,
  type OpportunityType,
} from "@/types/opportunity";
import type { HeroSlideBackground } from "@/pages/super-admin/LP_Manager/types";
import RichTextContent from "@/components/rich-text/RichTextContent";
import { isRichTextEmpty } from "@/components/rich-text/richTextUtils";
import { OpportunityPublicBannerHero } from "./OpportunityPublicBannerFrame";
import { OPPORTUNITY_BANNER_SPECS } from "../opportunityBannerSpecs";

type OpportunityPreviewPanelProps = {
  title: string;
  opportunityType: OpportunityType;
  format: OpportunityFormat;
  contractType: OpportunityContractType | null;
  durationStart: string | null;
  durationEnd: string | null;
  salaryMad: number | null;
  deadline: string;
  location: string;
  description: string;
  banner: HeroSlideBackground;
  documents?: { id: string; label: string; url: string; fileName: string }[];
};

export default function OpportunityPreviewPanel({
  title,
  opportunityType,
  format,
  contractType,
  durationStart,
  durationEnd,
  salaryMad,
  deadline,
  location,
  description,
  banner,
  documents = [],
}: OpportunityPreviewPanelProps) {
  const deadlineLabel = deadline
    ? new Date(deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const durationLabel = formatOpportunityDuration(durationStart, durationEnd);

  return (
    <div className="sticky top-6 min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <p className="border-b border-border bg-muted/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Aperçu page publique · {OPPORTUNITY_BANNER_SPECS.formatLabel}
      </p>
      <div className="overflow-hidden">
        <OpportunityPublicBannerHero
          banner={banner}
          typeLabel={OPPORTUNITY_TYPE_LABELS[opportunityType]}
          title={title.trim() || "Titre de l'opportunité"}
        />
      </div>
      <div className="space-y-3 p-4 text-sm">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
            {OPPORTUNITY_FORMAT_LABELS[format]}
          </span>
          {contractType && (
            <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
              {OPPORTUNITY_CONTRACT_TYPE_LABELS[contractType]}
            </span>
          )}
          {salaryMad != null && salaryMad > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <Banknote size={12} />
              {salaryMad.toLocaleString("fr-FR")} MAD
            </span>
          )}
        </div>
        <div className="flex items-start gap-2 text-muted-foreground">
          <MapPin size={14} className="mt-0.5 shrink-0" />
          <span>{location.trim() || "Lieu non renseigné"}</span>
        </div>
        {(durationStart || durationEnd) && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <Clock size={14} className="mt-0.5 shrink-0" />
            <span>Durée : {durationLabel}</span>
          </div>
        )}
        <div className="flex items-start gap-2 text-muted-foreground">
          <Calendar size={14} className="mt-0.5 shrink-0" />
          <span>Date limite : {deadlineLabel}</span>
        </div>
        {!isRichTextEmpty(description) && (
          <RichTextContent html={description} />
        )}
        {documents.length > 0 && (
          <div className="space-y-1 border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground">
              Documents ({documents.length})
            </p>
            <ul className="space-y-0.5">
              {documents.map((doc) => (
                <li key={doc.id} className="truncate text-xs text-primary">
                  {doc.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
