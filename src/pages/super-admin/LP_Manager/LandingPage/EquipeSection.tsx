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
import { DEFAULT_EQUIPE_CONTENT, type EquipeContent, type EquipeMember } from "../types";
import { EquipeMemberCard } from "./equipe/EquipeMemberCard";
import { EquipeMemberDetailModal } from "./equipe/EquipeMemberDetailModal";

type EquipeSectionProps = {
  content?: EquipeContent;
  className?: string;
};

export function EquipeSection({ content = DEFAULT_EQUIPE_CONTENT, className }: EquipeSectionProps) {
  const members = content.members ?? [];
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [detailMember, setDetailMember] = useState<EquipeMember | null>(null);

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
      {members.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          Aucun membre pour l’instant. Ajoutez l’équipe depuis l’éditeur « Équipe ».
        </p>
      ) : (
        <div className="space-y-5">
          <Carousel
            key={members.map((m) => m.id).join("|")}
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
              {members.map((m) => (
                <CarouselItem
                  key={m.id}
                  className="basis-full pl-3 sm:basis-1/2 sm:pl-4 lg:basis-1/3"
                >
                  <EquipeMemberCard member={m} onOpenDetail={setDetailMember} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious
              className="left-0 h-9 w-9 border-border bg-background/95 shadow-sm hover:bg-background disabled:opacity-40"
              aria-label="Membres précédents"
            />
            <CarouselNext
              className="right-0 h-9 w-9 border-border bg-background/95 shadow-sm hover:bg-background disabled:opacity-40"
              aria-label="Membres suivants"
            />
          </Carousel>

          {scrollSnaps.length > 1 ? (
            <div
              className="flex flex-wrap items-center justify-center gap-2"
              role="tablist"
              aria-label="Navigation de l’équipe"
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

      <EquipeMemberDetailModal member={detailMember} onClose={() => setDetailMember(null)} />
    </div>
  );
}
