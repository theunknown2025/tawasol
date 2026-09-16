import { cn } from "@/lib/utils";
import mawqi3iLogo from "./mawqi3i.png";

type CartographieMapBrandProps = {
  className?: string;
  imgClassName?: string;
};

/** Logo Mawqi3i for the cartographie page (header or map). */
export function CartographieMapBrand({ className, imgClassName }: CartographieMapBrandProps) {
  return (
    <div className={cn(className)} aria-hidden={false}>
      <img
        src={mawqi3iLogo}
        alt="Mawqi3i"
        className={cn(
          "h-[42px] w-auto max-w-[182px] object-contain object-right sm:h-[52px] sm:max-w-[234px] md:h-[57px] md:max-w-[260px]",
          imgClassName,
        )}
        loading="lazy"
        draggable={false}
      />
    </div>
  );
}
