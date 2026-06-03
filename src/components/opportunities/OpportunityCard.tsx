import { Link } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";
import { stripRichTextHtml } from "@/components/rich-text/richTextUtils";
import { slideBackgroundStyle } from "@/pages/super-admin/LP_Manager/types";
import {
  OPPORTUNITY_FORMAT_LABELS,
  OPPORTUNITY_TYPE_LABELS,
  type Opportunity,
} from "@/types/opportunity";

type OpportunityCardProps = {
  opportunity: Opportunity;
};

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  return (
    <Link
      to={`/opportunite/${opportunity.publicSlug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:border-emerald-500/40 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] w-full" style={slideBackgroundStyle(opportunity.banner)}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
          {OPPORTUNITY_TYPE_LABELS[opportunity.opportunityType]}
        </span>
        <h3 className="absolute bottom-3 left-3 right-3 text-lg font-bold text-white drop-shadow">
          {opportunity.title}
        </h3>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 text-sm">
        <span className="w-fit rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
          {OPPORTUNITY_FORMAT_LABELS[opportunity.format]}
        </span>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin size={14} />
          <span className="truncate">{opportunity.location || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar size={14} />
          <span>
            {new Date(opportunity.deadline).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function OpportunityRow({ opportunity }: OpportunityCardProps) {
  return (
    <Link
      to={`/opportunite/${opportunity.publicSlug}`}
      className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-emerald-500/40 hover:shadow-md"
    >
      <div
        className="h-24 w-36 shrink-0 rounded-lg"
        style={slideBackgroundStyle(opportunity.banner)}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700">
            {OPPORTUNITY_TYPE_LABELS[opportunity.opportunityType]}
          </span>
          <span className="text-xs text-muted-foreground">
            {OPPORTUNITY_FORMAT_LABELS[opportunity.format]}
          </span>
        </div>
        <h3 className="mt-1 font-semibold text-foreground group-hover:text-emerald-700">
          {opportunity.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {stripRichTextHtml(opportunity.description)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {opportunity.location} · Limite{" "}
          {new Date(opportunity.deadline).toLocaleDateString("fr-FR")}
        </p>
      </div>
    </Link>
  );
}
