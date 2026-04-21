import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroSectionContent } from "../types";
import { slideBackgroundStyle } from "../types";
import { cn } from "@/lib/utils";

type HeroSectionProps = {
  content: HeroSectionContent;
  className?: string;
};

export function HeroSection({ content, className }: HeroSectionProps) {
  const { slides, settings } = content;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const n = slides.length;
  const safeIndex = n > 0 ? Math.min(index, n - 1) : 0;

  useEffect(() => {
    if (n <= 1) return;
    setIndex((i) => (i >= n ? n - 1 : i));
  }, [n]);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (n <= 0) return;
      setIndex((i) => (i + dir + n) % n);
    },
    [n],
  );

  useEffect(() => {
    if (n <= 1 || paused) return;
    const ms = Math.max(2000, settings.slideDurationSec * 1000);
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % n);
    }, ms);
    return () => window.clearInterval(id);
  }, [n, paused, settings.slideDurationSec]);

  const showArrows = settings.showNavArrows && n > 1;

  if (n === 0) {
    return (
      <section className={cn("flex min-h-[50vh] items-center justify-center px-6", className)}>
        <p className="text-muted-foreground">Aucune diapositive.</p>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "relative isolate flex min-h-[70vh] w-full flex-col overflow-hidden",
        className,
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrousel"
    >
      {slides.map((s, i) => {
        const active = i === safeIndex;
        const showCtas = s.showActionButtons !== false;
        const showSecondary =
          s.secondaryCta.label.trim().length > 0 || s.secondaryCta.href.trim().length > 0;
        const isImageBg = s.background.type === "image";
        return (
          <div
            key={s.id}
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center px-6 py-20 text-center transition-opacity duration-500 ease-out",
              active ? "z-[1] pointer-events-auto opacity-100" : "z-0 pointer-events-none opacity-0",
            )}
            style={slideBackgroundStyle(s.background)}
            aria-hidden={!active}
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b",
                isImageBg
                  ? "from-[#8f3119]/35 via-[#8f3119]/25 to-[#5f2314]/55"
                  : "from-[#8f3119]/55 via-[#7b2d17]/45 to-[#5f2314]/70",
              )}
              aria-hidden
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

            <div className="mx-auto max-w-3xl space-y-6 text-balance drop-shadow-sm">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
                {s.title}
              </h1>
              <p className="text-pretty text-lg text-white/90 sm:text-xl">{s.subtitle}</p>
              {s.timeLabel.trim().length > 0 && (
                <p className="text-base font-medium text-white/95 sm:text-lg">{s.timeLabel}</p>
              )}
              {showCtas && (
                <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row sm:gap-4">
                  <a
                    href={s.primaryCta.href || "#"}
                    className="inline-flex h-11 min-w-[10rem] items-center justify-center rounded-xl bg-[#f4a40c] px-6 text-sm font-semibold text-[#5f2314] shadow-md transition hover:bg-[#f0b53a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a40c] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  >
                    {s.primaryCta.label}
                  </a>
                  {showSecondary && (
                    <a
                      href={s.secondaryCta.href || "#"}
                      className="inline-flex h-11 min-w-[10rem] items-center justify-center rounded-xl border-2 border-[#f4a40c]/80 bg-[#8f3119]/35 px-6 text-sm font-semibold text-[#fff3dc] backdrop-blur-sm transition hover:bg-[#8f3119]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a40c]"
                    >
                      {s.secondaryCta.label}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {n > 1 && (
        <div
          className="pointer-events-none absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-1.5"
          aria-hidden
        >
          {slides.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                "h-1.5 w-1.5 rounded-full bg-white/40 transition-all",
                i === safeIndex && "w-6 bg-white",
              )}
            />
          ))}
        </div>
      )}

      {showArrows && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-md transition hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:left-6"
            aria-label="Diapositive précédente"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-md transition hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:right-6"
            aria-label="Diapositive suivante"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </section>
  );
}
