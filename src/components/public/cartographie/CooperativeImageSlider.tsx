import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { CooperativeImage } from "@/pages/super-admin/LP_Manager/Barometre/barometreCooperativesApi";
import { normalizeCooperativeImages } from "@/pages/super-admin/LP_Manager/Barometre/barometreCooperativesApi";

type Props = {
  images: CooperativeImage[];
  alt?: string;
};

/** Large image slider for the public cooperative detail page. */
export default function CooperativeImageSlider({ images, alt = "" }: Props) {
  const slides = normalizeCooperativeImages(images);

  if (slides.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground sm:min-h-[320px] md:min-h-[420px]">
        Aucune image
      </div>
    );
  }

  if (slides.length === 1) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-muted/30 shadow-sm">
        <div className="relative aspect-[16/10] w-full sm:aspect-[16/9] md:min-h-[420px]">
          <img
            src={slides[0]!.url}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {slides[0]!.isMain ? (
            <span className="absolute left-3 top-3 rounded-md bg-background/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-sm">
              Principale
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <Carousel
      opts={{ align: "center", loop: true }}
      className="relative w-full px-12 sm:px-14 md:px-16"
    >
      <CarouselContent>
        {slides.map((img, i) => (
          <CarouselItem key={`${img.url}-${i}`}>
            <div className="overflow-hidden rounded-2xl border border-border bg-muted/30 shadow-sm">
              <div className="relative aspect-[16/10] w-full sm:aspect-[16/9] md:min-h-[420px]">
                <img
                  src={img.url}
                  alt={alt ? `${alt} — photo ${i + 1}` : ""}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {img.isMain ? (
                  <span className="absolute left-3 top-3 rounded-md bg-background/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-sm">
                    Principale
                  </span>
                ) : (
                  <span className="absolute left-3 top-3 rounded-md bg-background/80 px-2 py-1 text-[10px] font-medium text-muted-foreground shadow-sm">
                    {i + 1} / {slides.length}
                  </span>
                )}
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-0 h-10 w-10 border-border bg-background/95 shadow-md" />
      <CarouselNext className="right-0 h-10 w-10 border-border bg-background/95 shadow-md" />
    </Carousel>
  );
}
