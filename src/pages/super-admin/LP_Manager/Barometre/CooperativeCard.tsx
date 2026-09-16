import { Eye, Facebook, Instagram, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BarometreCooperative } from "./barometreCooperativesApi";

function toExternalHref(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("@")) return `https://instagram.com/${t.slice(1)}`;
  return `https://${t}`;
}

type Props = {
  coop: BarometreCooperative;
  onClose: () => void;
  className?: string;
};

export default function CooperativeCard({ coop, onClose, className }: Props) {
  const facebookHref = coop.facebookUrl.trim() ? toExternalHref(coop.facebookUrl) : "";
  const instagramHref = coop.instagramUrl.trim() ? toExternalHref(coop.instagramUrl) : "";

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-[min(100%,320px)] flex-col overflow-hidden rounded-lg border border-border bg-popover text-left text-popover-foreground shadow-lg",
        className,
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex min-w-0 flex-1 items-start gap-1.5">
          <p className="min-w-0 flex-1 text-sm font-semibold leading-tight text-foreground">{coop.nom}</p>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" asChild>
            <Link
              to={`/cartographie/cooperative/${coop.id}`}
              aria-label={`Voir la page de ${coop.nom}`}
              title="Voir la page"
            >
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {!coop.isPublished ? (
        <p className="border-b border-border bg-amber-500/10 px-3 py-1.5 text-[10px] font-medium text-amber-900 dark:text-amber-200">
          Brouillon (visible admin uniquement)
        </p>
      ) : null}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {coop.imageUrl ? (
          <img
            src={coop.imageUrl}
            alt=""
            className="max-h-36 w-full rounded-md border border-border object-contain"
          />
        ) : null}

        {coop.description ? (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Description
            </p>
            <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-foreground">
              {coop.description}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Aucune description renseignée.</p>
        )}

        {facebookHref || instagramHref ? (
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            {facebookHref ? (
              <a
                href={facebookHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Facebook className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Facebook
              </a>
            ) : null}
            {instagramHref ? (
              <a
                href={instagramHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Instagram className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Instagram
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
