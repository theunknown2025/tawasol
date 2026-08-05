import { useMemo, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ExternalLink, MapPin } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchBarometreCooperatives,
  type BarometreCooperative,
} from "@/pages/super-admin/LP_Manager/Barometre/barometreCooperativesApi";
import BarometreEvaluationRadar from "@/pages/super-admin/LP_Manager/Barometre/BarometreEvaluationRadar";

function presidentGenreLabel(g: BarometreCooperative["presidentGenre"]): string {
  if (g === "male") return "Homme";
  if (g === "female") return "Femme";
  return "—";
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  if (children == null || children === "") return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm text-foreground">{children}</div>
    </div>
  );
}

export default function PublicBarometreCooperativePage() {
  const { id = "" } = useParams<{ id: string }>();

  const { data: cooperatives = [], isLoading, isError } = useQuery({
    queryKey: ["barometre-cooperatives", "public-detail"],
    queryFn: fetchBarometreCooperatives,
    staleTime: 60_000,
  });

  const { coop, prevId, nextId, index, total } = useMemo(() => {
    const idx = cooperatives.findIndex((c) => c.id === id);
    if (idx < 0) {
      return { coop: null as BarometreCooperative | null, prevId: null, nextId: null, index: -1, total: 0 };
    }
    return {
      coop: cooperatives[idx]!,
      prevId: idx > 0 ? cooperatives[idx - 1]!.id : null,
      nextId: idx < cooperatives.length - 1 ? cooperatives[idx + 1]!.id : null,
      index: idx,
      total: cooperatives.length,
    };
  }, [cooperatives, id]);

  if (isLoading) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-5xl px-4 py-10 text-center text-sm text-muted-foreground">
          Chargement de la coopérative…
        </div>
      </PublicShell>
    );
  }

  if (isError || !coop) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">Coopérative introuvable ou non publiée.</p>
          <Button asChild variant="outline">
            <Link to="/cartographie">Retour à la cartographie</Link>
          </Button>
        </div>
      </PublicShell>
    );
  }

  const phones = coop.phones.length > 0 ? coop.phones : coop.tel ? [coop.tel] : [];
  const secteur = coop.secteur || coop.activite;

  return (
    <PublicShell>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PublicBreadcrumbs
            items={[
              { label: "Accueil", to: "/" },
              { label: "Cartographie", to: "/cartographie" },
              { label: coop.nom },
            ]}
          />
          <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
            {prevId ? (
              <Button variant="outline" size="icon" asChild aria-label="Coopérative précédente" title="Précédente">
                <Link to={`/cartographie/cooperative/${prevId}`}>
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="icon" disabled aria-label="Coopérative précédente">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <span className="min-w-[4.5rem] text-center text-xs tabular-nums text-muted-foreground">
              {index + 1} / {total}
            </span>
            {nextId ? (
              <Button variant="outline" size="icon" asChild aria-label="Coopérative suivante" title="Suivante">
                <Link to={`/cartographie/cooperative/${nextId}`}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="icon" disabled aria-label="Coopérative suivante">
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <header className="space-y-3 border-b border-border pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {coop.nom}
            </h1>
            {coop.isPublished ? (
              <Badge variant="secondary">Publiée</Badge>
            ) : (
              <Badge variant="outline">Brouillon</Badge>
            )}
          </div>
          {secteur ? <p className="text-muted-foreground">{secteur}</p> : null}
          {coop.sousSecteur ? (
            <p className="text-sm text-muted-foreground">Sous-secteur : {coop.sousSecteur}</p>
          ) : null}
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,280px)_1fr]">
          <aside className="space-y-4">
            {coop.imageUrl ? (
              <img
                src={coop.imageUrl}
                alt=""
                className="w-full rounded-xl border border-border object-cover shadow-sm"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
                Aucune image
              </div>
            )}
            {(coop.communeName || coop.provinceName || (coop.latitude != null && coop.longitude != null)) && (
              <div className="rounded-xl border border-border bg-card p-4 text-sm">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  Localisation
                </p>
                {[coop.communeName, coop.provinceName].filter(Boolean).join(" · ") || null}
                {coop.latitude != null && coop.longitude != null ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    X {coop.longitude} · Y {coop.latitude}
                  </p>
                ) : null}
              </div>
            )}
          </aside>

          <div className="space-y-8">
            {coop.description ? (
              <section>
                <h2 className="text-sm font-semibold text-foreground">Description</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {coop.description}
                </p>
              </section>
            ) : null}

            <section className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Téléphones">
                {phones.length > 0 ? (
                  <ul className="space-y-1">
                    {phones.map((p) => (
                      <li key={p}>
                        <a href={`tel:${p}`} className="text-primary underline-offset-2 hover:underline">
                          {p}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </DetailField>
              <DetailField label="Email">
                {coop.email ? (
                  <a href={`mailto:${coop.email}`} className="break-all text-primary underline-offset-2 hover:underline">
                    {coop.email}
                  </a>
                ) : null}
              </DetailField>
              <DetailField label="Adresse">{coop.adresse || null}</DetailField>
              <DetailField label="Temps de travail">{coop.tempsDeTravail || null}</DetailField>
              <DetailField label="Facebook">
                {coop.facebookUrl ? (
                  <a
                    href={coop.facebookUrl.startsWith("http") ? coop.facebookUrl : `https://${coop.facebookUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 break-all text-primary underline-offset-2 hover:underline"
                  >
                    {coop.facebookUrl}
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                  </a>
                ) : null}
              </DetailField>
              <DetailField label="Instagram">
                {coop.instagramUrl ? (
                  <a
                    href={
                      coop.instagramUrl.startsWith("http")
                        ? coop.instagramUrl
                        : `https://instagram.com/${coop.instagramUrl.replace(/^@/, "")}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 break-all text-primary underline-offset-2 hover:underline"
                  >
                    {coop.instagramUrl}
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                  </a>
                ) : null}
              </DetailField>
            </section>

            {(coop.presidentNomComplet ||
              coop.presidentGenre ||
              coop.presidentEmail ||
              coop.presidentTel) && (
              <section className="rounded-xl border border-border bg-muted/20 p-4">
                <h2 className="text-sm font-semibold text-foreground">Président(e)</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <DetailField label="Genre">{presidentGenreLabel(coop.presidentGenre)}</DetailField>
                  <DetailField label="Nom">{coop.presidentNomComplet || null}</DetailField>
                  <DetailField label="Email">
                    {coop.presidentEmail ? (
                      <a
                        href={`mailto:${coop.presidentEmail}`}
                        className="break-all text-primary underline-offset-2 hover:underline"
                      >
                        {coop.presidentEmail}
                      </a>
                    ) : null}
                  </DetailField>
                  <DetailField label="Téléphone">{coop.presidentTel || null}</DetailField>
                </div>
              </section>
            )}

            {coop.links.length > 0 ? (
              <section>
                <h2 className="text-sm font-semibold text-foreground">Liens</h2>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                  {coop.links.map((l, i) => (
                    <li key={i}>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline-offset-2 hover:underline break-all"
                      >
                        {l.label || l.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="mb-4 space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Évaluation coopérative</h2>
            <p className="text-sm text-muted-foreground">
              Profil radar des scores (1 à 5). Survolez un point ou un critère pour le détail.
            </p>
          </div>
          <BarometreEvaluationRadar evaluation={coop.evaluation} />
        </section>

        <div className="flex justify-between border-t border-border pt-4">
          <Button asChild variant="outline">
            <Link to="/cartographie">Retour à la cartographie</Link>
          </Button>
          <div className="flex gap-2">
            {prevId ? (
              <Button asChild variant="ghost" size="sm">
                <Link to={`/cartographie/cooperative/${prevId}`}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Précédente
                </Link>
              </Button>
            ) : null}
            {nextId ? (
              <Button asChild variant="ghost" size="sm">
                <Link to={`/cartographie/cooperative/${nextId}`}>
                  Suivante
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
