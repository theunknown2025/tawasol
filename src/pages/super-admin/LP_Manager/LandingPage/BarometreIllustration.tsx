import barometreDashboardImage from "@/components/public/logoscarto/aed2501b-3902-4f02-801f-bab95253f883.png";
import { cn } from "@/lib/utils";

type BarometreIllustrationProps = {
  className?: string;
};

/** Illustration du baromètre des coopératives marocaines. */
export function BarometreIllustration({ className }: BarometreIllustrationProps) {
  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-border/60",
        className,
      )}
    >
      <img
        src={barometreDashboardImage}
        alt="Baromètre des coopératives marocaines — tableau de bord avec indicateurs, répartition régionale et évolution du secteur"
        className="h-auto w-full object-cover object-center"
        loading="lazy"
        decoding="async"
      />
    </figure>
  );
}
