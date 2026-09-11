import mawqi3iLogo from "./mawqi3i.png";

type CartographieMapBrandProps = {
  className?: string;
};

/** Logo Mawqi3i overlayed on the cartographie map. */
export function CartographieMapBrand({ className }: CartographieMapBrandProps) {
  return (
    <div
      className={
        className ??
        "pointer-events-none absolute bottom-3 left-3 z-[1000] sm:bottom-4 sm:left-4"
      }
      aria-hidden={false}
    >
      <div className="rounded-lg border border-white/10 bg-black/95 px-2.5 py-2 shadow-lg backdrop-blur-sm sm:px-3 sm:py-2.5">
        <img
          src={mawqi3iLogo}
          alt="Mawqi3i"
          className="h-8 w-auto max-w-[140px] object-contain object-left sm:h-10 sm:max-w-[180px] md:h-11 md:max-w-[200px]"
          loading="lazy"
          draggable={false}
        />
      </div>
    </div>
  );
}
