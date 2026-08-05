import { Link } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";
import { slideBackgroundStyle } from "@/pages/super-admin/LP_Manager/types";
import { formatLpProjetDates, type LpProjet } from "@/types/lpProjet";
import { Badge } from "@/components/ui/badge";

type ProjetCardProps = {
  projet: LpProjet;
};

export function ProjetCard({ projet }: ProjetCardProps) {
  return (
    <Link
      to={`/projet/${projet.publicSlug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:border-primary/40 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] w-full" style={slideBackgroundStyle(projet.banner)}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <h3 className="absolute bottom-3 left-3 right-3 text-lg font-bold text-white drop-shadow">
          {projet.title}
        </h3>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar size={14} />
          <span>{formatLpProjetDates(projet.dateDebut, projet.dateFin)}</span>
        </div>
        {projet.zones.length > 0 ? (
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin size={14} className="mt-0.5 shrink-0" />
            <div className="flex flex-wrap gap-1">
              {projet.zones.slice(0, 3).map((z) => (
                <Badge key={z} variant="secondary" className="text-xs font-normal">
                  {z}
                </Badge>
              ))}
              {projet.zones.length > 3 ? (
                <span className="text-xs">+{projet.zones.length - 3}</span>
              ) : null}
            </div>
          </div>
        ) : null}
        <p className="line-clamp-2 text-muted-foreground">
          {projet.description || "Découvrir ce projet"}
        </p>
      </div>
    </Link>
  );
}

export function ProjetRow({ projet }: ProjetCardProps) {
  return (
    <Link
      to={`/projet/${projet.publicSlug}`}
      className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md"
    >
      <div
        className="h-24 w-36 shrink-0 rounded-lg"
        style={slideBackgroundStyle(projet.banner)}
      />
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-foreground">{projet.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {projet.description || "—"}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {formatLpProjetDates(projet.dateDebut, projet.dateFin)}
          {projet.zones.length > 0 ? ` · ${projet.zones.join(", ")}` : ""}
          {projet.results.length > 0
            ? ` · ${projet.results.length} réalisation${projet.results.length > 1 ? "s" : ""}`
            : ""}
        </p>
      </div>
    </Link>
  );
}
