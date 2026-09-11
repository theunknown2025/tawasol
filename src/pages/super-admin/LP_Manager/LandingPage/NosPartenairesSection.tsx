import { useCallback, useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import {
  DEFAULT_NOS_PARTENAIRES_CONTENT,
  type NosPartenaireEntry,
  type NosPartenairesContent,
} from "../types";
import { PartenaireCard } from "./partenaires/PartenaireCard";
import { PartenaireDetailModal } from "./partenaires/PartenaireDetailModal";

type NosPartenairesSectionProps = {
  content?: NosPartenairesContent;
  className?: string;
};

export function NosPartenairesSection({
  content = DEFAULT_NOS_PARTENAIRES_CONTENT,
  className,
}: NosPartenairesSectionProps) {
  const subtitle = content.subtitle?.trim() ?? "";
  const entries = content.entries ?? [];
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [detailEntry, setDetailEntry] = useState<NosPartenaireEntry | null>(null);

  const onSelect = useCallback((embla: CarouselApi) => {
    if (!embla) return;
    setSelectedIndex(embla.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;
    setScrollSnaps(api.scrollSnapList());
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect]);

  return (
    <div className={cn("mx-auto max-w-6xl px-4 pb-8 pt-1 md:pb-10 md:pt-2 lg:px-8", className)}>
      {subtitle ? (
        <p className="mx-auto mb-4 max-w-3xl text-center text-sm leading-snug text-muted-foreground md:mb-5 md:text-base md:leading-relaxed">
          {subtitle}
        </p>
      ) : null}
      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          Aucun partenaire pour l’instant. Ajoutez des fiches depuis l’éditeur « Nos partenaires ».
        </p>
      ) : (
        <div className="space-y-5">
          <Carousel
            key={entries.map((e) => e.id).join("|")}
            setApi={setApi}
            opts={{
              align: "start",
              slidesToScroll: 1,
              loop: false,
              containScroll: "trimSnaps",
            }}
            className="relative w-full px-11 sm:px-14 md:px-16"
          >
            <CarouselContent className="-ml-3 sm:-ml-4">
              {entries.map((e) => (
                <CarouselItem key={e.id} className="basis-full pl-3 sm:basis-1/2 sm:pl-4">
                  <PartenaireCard entry={e} onOpenDetail={setDetailEntry} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious
              className="left-0 h-9 w-9 border-border bg-background/95 shadow-sm hover:bg-background disabled:opacity-40"
              aria-label="Partenaires précédents"
            />
            <CarouselNext
              className="right-0 h-9 w-9 border-border bg-background/95 shadow-sm hover:bg-background disabled:opacity-40"
              aria-label="Partenaires suivants"
            />
          </Carousel>

          {scrollSnaps.length > 1 ? (
            <div
              className="flex flex-wrap items-center justify-center gap-2"
              role="tablist"
              aria-label="Navigation des partenaires"
            >
              {scrollSnaps.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  aria-selected={index === selectedIndex}
                  aria-label={`Aller à la vue ${index + 1}`}
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-200",
                    index === selectedIndex
                      ? "w-6 bg-primary"
                      : "w-2.5 bg-muted-foreground/35 hover:bg-muted-foreground/55",
                  )}
                  onClick={() => api?.scrollTo(index)}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}

      <PartenaireDetailModal entry={detailEntry} onClose={() => setDetailEntry(null)} />
    </div>
  );
}
