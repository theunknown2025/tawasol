import bilanImpactImage from "@/components/public/logoscarto/Image2.png";
import { cn } from "@/lib/utils";

type BilanIllustrationProps = {
  className?: string;
};

/** Illustration du bilan d’impact REMESS (réalisations 2021–2025). */
export function BilanIllustration({ className }: BilanIllustrationProps) {
  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-border/60",
        className,
      )}
    >
      <img
        src={bilanImpactImage}
        alt="Bilan REMESS — Nos réalisations notre impact : résultats concrets sur les territoires, filières et couverture nationale"
        className="h-auto w-full object-cover object-center"
        loading="lazy"
        decoding="async"
      />
    </figure>
  );
}
