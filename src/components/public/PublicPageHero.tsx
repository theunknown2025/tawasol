import { cn } from "@/lib/utils";

type PublicPageHeroProps = {
  title: string;
  description?: string;
  className?: string;
  /** Largeur max du bloc titre (défaut ~1152px). Utile pour aligner avec un contenu plus large. */
  contentMaxWidthClassName?: string;
};

/**
 * Bandeau pleine largeur viewport (hors contrainte max-w du contenu).
 * Le texte reste dans une colonne lisible centrée.
 */
export function PublicPageHero({
  title,
  description,
  className,
  contentMaxWidthClassName = "max-w-6xl",
}: PublicPageHeroProps) {
  return (
    <section
      className={cn(
        "relative w-screen max-w-[100vw] shrink-0 border-b border-border bg-gradient-to-br from-primary/[0.12] via-background to-muted/60 shadow-sm",
        "left-1/2 -translate-x-1/2",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className={cn(
          "relative mx-auto w-full px-4 py-10 md:px-8 md:py-12 lg:px-8",
          contentMaxWidthClassName,
        )}
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-4xl">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">{description}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
