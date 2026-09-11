import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchLatestHeroPublications,
  type HeroPublicationSlide,
} from "@/lib/heroPublicationsApi";

const SLIDE_DURATION_MS = 5000;

type HeroLatestPublicationsSliderProps = {
  className?: string;
};

function PublicationThumbnail({ slide }: { slide: HeroPublicationSlide }) {
  if (slide.imageUrl) {
    return (
      <img
        src={slide.imageUrl}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
      />
    );
  }

  return <div className="h-full w-full" style={slide.thumbnailStyle} aria-hidden />;
}

export default function HeroLatestPublicationsSlider({
  className,
}: HeroLatestPublicationsSliderProps) {
  const { data: slides = [], isLoading } = useQuery({
    queryKey: ["hero", "latest-publications"],
    queryFn: fetchLatestHeroPublications,
    staleTime: 60_000,
  });

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = slides.length;
  const safeIndex = count > 0 ? index % count : 0;

  useEffect(() => {
    if (count <= 1) return;
    setIndex((i) => (i >= count ? 0 : i));
  }, [count]);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (count <= 0) return;
      setIndex((i) => (i + dir + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, SLIDE_DURATION_MS);
    return () => window.clearInterval(id);
  }, [count, paused]);

  if (isLoading || count === 0) return null;

  return (
    <div
      className={cn("w-full bg-[#8f3119] text-[#fff8ee]", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrousel"
      aria-label="Nos dernières activités"
    >
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-5 md:px-8">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-[#fff3dc] sm:text-sm">
          Nos dernières activités
        </p>
        <div className="flex items-center gap-2 sm:gap-3">
          {count > 1 && (
            <button
              type="button"
              onClick={() => go(-1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white transition hover:bg-black/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a40c] sm:h-10 sm:w-10"
              aria-label="Activité précédente"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl border border-[#5f2314]/30 bg-[#fff8ee] shadow-md">
            <div className="relative h-[6.5rem] sm:h-[7.25rem] md:h-[8rem]">
              {slides.map((slide, i) => {
                const active = i === safeIndex;
                return (
                  <div
                    key={slide.id}
                    className={cn(
                      "absolute inset-0 flex transition-opacity duration-500 ease-out",
                      active ? "z-[1] opacity-100" : "z-0 pointer-events-none opacity-0",
                    )}
                    aria-hidden={!active}
                    aria-live={active ? "polite" : "off"}
                  >
                    <div className="relative h-full w-[38%] min-w-[7rem] max-w-[12rem] shrink-0 sm:w-[30%] sm:max-w-[14rem]">
                      <PublicationThumbnail slide={slide} />
                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent to-[#fff8ee]"
                        aria-hidden
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-4 py-3 sm:px-5">
                      <span className="w-fit rounded-full bg-[#f4a40c] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#5f2314] sm:text-xs">
                        {slide.kindLabel}
                      </span>
                      <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#5f2314] sm:text-lg">
                        {slide.title}
                      </h3>
                    </div>

                    <Link
                      to={slide.href}
                      tabIndex={active ? 0 : -1}
                      className="flex w-14 shrink-0 items-center justify-center border-l border-[#8f3119]/15 text-[#8f3119] transition hover:bg-[#8f3119]/10 sm:w-16"
                      aria-label={`Explorer : ${slide.title}`}
                      title="Explorer"
                    >
                      <Compass className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.75} />
                    </Link>
                  </div>
                );
              })}
            </div>

            {count > 1 && (
              <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5" aria-hidden>
                {slides.map((slide, i) => (
                  <span
                    key={slide.id}
                    className={cn(
                      "h-1.5 rounded-full bg-[#8f3119]/25 transition-all",
                      i === safeIndex ? "w-5 bg-[#8f3119]" : "w-1.5",
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {count > 1 && (
            <button
              type="button"
              onClick={() => go(1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white transition hover:bg-black/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a40c] sm:h-10 sm:w-10"
              aria-label="Activité suivante"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
