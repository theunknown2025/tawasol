import { Eye, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { BarometreCooperative } from "@/pages/super-admin/LP_Manager/Barometre/barometreCooperativesApi";
import { averageEvaluationScore } from "@/pages/super-admin/LP_Manager/Barometre/barometreEvaluation";

function shortDescription(text: string, max = 120): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "Aucune description.";
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

type CardProps = {
  coop: BarometreCooperative;
};

function LatestCooperativeCard({ coop }: CardProps) {
  const avg = averageEvaluationScore(coop.evaluation);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="relative aspect-[16/10] bg-muted">
        {coop.imageUrl ? (
          <img
            src={coop.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Pas d’image
          </div>
        )}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 rounded-full border border-border/60 bg-background/95 shadow-sm"
          asChild
        >
          <Link
            to={`/cartographie/cooperative/${coop.id}`}
            aria-label={`Voir la page de ${coop.nom}`}
            title="Voir la page"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{coop.nom}</h3>
        <p className="line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">
          {shortDescription(coop.description)}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-foreground">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden />
          {avg != null ? (
            <span className="tabular-nums">
              <span className="font-semibold">{avg.toFixed(1)}</span>
              <span className="text-muted-foreground"> / 5</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Non évaluée</span>
          )}
        </div>
      </div>
    </article>
  );
}

type Props = {
  cooperatives: BarometreCooperative[];
  limit?: number;
};

/** Quatre dernières coopératives (par date de création), sous la carte. */
export function LatestCooperativesSection({ cooperatives, limit = 4 }: Props) {
  const latest = cooperatives.slice(0, limit);

  if (latest.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="dernieres-cooperatives-title">
      <div>
        <h2 id="dernieres-cooperatives-title" className="text-lg font-semibold text-foreground">
          Les dernières coopératives
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Les plus récemment ajoutées à la cartographie.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {latest.map((coop) => (
          <LatestCooperativeCard key={coop.id} coop={coop} />
        ))}
      </div>
    </section>
  );
}
