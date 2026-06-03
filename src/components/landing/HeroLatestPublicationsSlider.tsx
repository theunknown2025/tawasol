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
  onVisibilityChange?: (visible: boolean) => void;
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
  onVisibilityChange,
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
    onVisibilityChange?.(!isLoading && count > 0);
  }, [count, isLoading, onVisibilityChange]);

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
      className={cn(
        "pointer-events-auto absolute bottom-5 left-1/2 z-20 w-[min(94vw,56rem)] -translate-x-1/2",
        className,
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrousel"
      aria-label="Nos dernières publications"
    >
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-white/90 sm:text-sm">
        Nos dernières publications
      </p>
      <div className="flex items-center gap-2 sm:gap-3">
        {count > 1 && (
          <button
            type="button"
            onClick={() => go(-1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white shadow-lg backdrop-blur-md transition hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:h-10 sm:w-10"
            aria-label="Publication précédente"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/25 bg-black/55 shadow-2xl backdrop-blur-md">
          <div className="relative h-[7.25rem] sm:h-[8.25rem] md:h-[9rem]">
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
                  <div className="relative h-full w-[38%] min-w-[7.5rem] max-w-[13rem] shrink-0 sm:w-[34%] sm:max-w-[15rem]">
                    <PublicationThumbnail slide={slide} />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/55"
                      aria-hidden
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-4 py-3 sm:px-5 sm:py-4">
                    <span className="w-fit rounded-full bg-[#f4a40c] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#5f2314] sm:text-xs">
                      {slide.kindLabel}
                    </span>
                    <h3 className="line-clamp-2 text-base font-bold leading-snug text-white sm:text-lg md:text-xl">
                      {slide.title}
                    </h3>
                  </div>

                  <Link
                    to={slide.href}
                    tabIndex={active ? 0 : -1}
                    className="flex w-14 shrink-0 items-center justify-center border-l border-white/15 text-white transition hover:bg-white/10 sm:w-16"
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
                    "h-1.5 rounded-full bg-white/35 transition-all",
                    i === safeIndex ? "w-5 bg-white" : "w-1.5",
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white shadow-lg backdrop-blur-md transition hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:h-10 sm:w-10"
            aria-label="Publication suivante"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
