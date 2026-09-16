import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicBilanDocument } from "@/lib/publicBilanApi";
import { cn } from "@/lib/utils";

type BilanTimelineProps = {
  documents: PublicBilanDocument[];
  /** Limite d’items (aperçu landing). */
  limit?: number;
  className?: string;
};

export function BilanTimeline({ documents, limit, className }: BilanTimelineProps) {
  const items = typeof limit === "number" ? documents.slice(0, limit) : documents;

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        Aucun bilan publié pour le moment.
      </p>
    );
  }

  return (
    <ol className={cn("relative space-y-0", className)}>
      {items.map((doc, index) => {
        const isLast = index === items.length - 1;
        return (
          <li key={doc.id} className="relative flex gap-4 pb-10 last:pb-0 sm:gap-6">
            {!isLast ? (
              <span
                className="absolute left-[1.15rem] top-10 bottom-0 w-px bg-border sm:left-[1.4rem]"
                aria-hidden
              />
            ) : null}
            <div className="relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-xs font-bold tabular-nums text-primary sm:h-11 sm:w-11 sm:text-sm">
              {String(doc.year).slice(2)}
            </div>
            <div className="min-w-0 flex-1 pt-0.5 sm:pt-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary tabular-nums">
                {doc.year}
              </p>
              <h3 className="mt-1 text-lg font-semibold leading-snug text-foreground">{doc.title}</h3>
              {doc.description.trim() ? (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {doc.description}
                </p>
              ) : null}
              <Button asChild variant="outline" size="sm" className="mt-4 gap-2">
                <Link to={`/bilan-remess/${doc.id}`}>
                  Découvrir
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
