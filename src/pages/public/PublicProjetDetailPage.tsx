import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import { Badge } from "@/components/ui/badge";
import { fetchPublicLpProjetBySlug } from "@/lib/lpProjetsApi";
import { formatLpProjetDates } from "@/types/lpProjet";
import { slideBackgroundStyle } from "@/pages/super-admin/LP_Manager/types";
import { resolveProjetResultIcon } from "@/pages/super-admin/LP_Manager/ProjetsManager/projetResultIcons";

export default function PublicProjetDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();

  const { data: projet, isLoading } = useQuery({
    queryKey: ["public-lp-projet", slug],
    queryFn: () => fetchPublicLpProjetBySlug(slug),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <PublicShell>
        <div className="p-8 text-center text-sm text-muted-foreground">Chargement…</div>
      </PublicShell>
    );
  }

  if (!projet) {
    return (
      <PublicShell>
        <div className="p-8 text-center text-sm text-muted-foreground">Projet introuvable.</div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <div className="relative w-full" style={slideBackgroundStyle(projet.banner)}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />
        <div className="relative mx-auto flex min-h-[14rem] max-w-6xl flex-col justify-end px-4 py-10 md:min-h-[18rem] md:px-8 md:py-14">
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-white drop-shadow md:text-4xl">
            {projet.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/90">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatLpProjetDates(projet.dateDebut, projet.dateFin)}
            </span>
            {projet.zones.length > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {projet.zones.join(" · ")}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-10 md:px-8">
        <PublicBreadcrumbs
          items={[
            { label: "Accueil", to: "/" },
            { label: "Projets", to: "/projets" },
            { label: projet.title },
          ]}
        />

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Description</h2>
          <p className="max-w-3xl whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
            {projet.description.trim() || "Aucune description disponible."}
          </p>
        </section>

        {projet.results.length > 0 ? (
          <section className="space-y-5">
            <h2 className="text-xl font-semibold tracking-tight">Résultats</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projet.results.map((result) => {
                const Icon = resolveProjetResultIcon(result.iconKey);
                return (
                  <li
                    key={result.id}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 text-center shadow-sm"
                  >
                    <Icon className="h-8 w-8 text-primary" aria-hidden />
                    <p className="text-3xl font-bold tabular-nums text-foreground">
                      {result.numberValue || "—"}
                    </p>
                    <p className="text-sm font-medium text-foreground">{result.title || "Réalisation"}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {projet.zones.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Zone d’intervention</h2>
            <div className="flex flex-wrap gap-2">
              {projet.zones.map((zone) => (
                <Badge key={zone} variant="secondary" className="px-3 py-1 text-sm">
                  <MapPin className="mr-1.5 h-3.5 w-3.5" />
                  {zone}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}

        {projet.partners.length > 0 ? (
          <section className="space-y-5">
            <h2 className="text-xl font-semibold tracking-tight">
              Bailleurs de fonds / Partenaires
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {projet.partners.map((partner) => (
                <li
                  key={partner.id}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center shadow-sm"
                >
                  <div className="flex h-20 w-full items-center justify-center overflow-hidden rounded-lg bg-muted/40">
                    {partner.logoUrl ? (
                      <img
                        src={partner.logoUrl}
                        alt={partner.name || "Partenaire"}
                        className="max-h-16 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">Sans logo</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {partner.name || "Partenaire"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </PublicShell>
  );
}
