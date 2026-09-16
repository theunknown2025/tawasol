import cartographieMapImage from "@/components/public/logoscarto/Image1.png";
import { cn } from "@/lib/utils";

type CartographieIllustrationProps = {
  className?: string;
};

/** Illustration de la cartographie des coopératives du Maroc. */
export function CartographieIllustration({ className }: CartographieIllustrationProps) {
  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-border/60",
        className,
      )}
    >
      <img
        src={cartographieMapImage}
        alt="Carte interactive du Maroc avec les coopératives recensées par secteur d’activité et une liste des coopératives à proximité"
        className="h-auto w-full object-cover object-center"
        loading="lazy"
        decoding="async"
      />
    </figure>
  );
}
