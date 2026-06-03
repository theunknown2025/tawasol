import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  DEFAULT_GALERIE_CONTENT,
  type GalerieContent,
  type GalerieDisplayMode,
  type GalerieImage,
} from "../types";

const ALL_PHOTOS_TAB = "__all__";

type FlatImage = GalerieImage & { catalogueName: string };

function flattenImages(
  catalogues: GalerieContent["catalogues"],
  filterCatalogueId: string | typeof ALL_PHOTOS_TAB,
): FlatImage[] {
  const result: FlatImage[] = [];
  for (const cat of catalogues) {
    if (filterCatalogueId !== ALL_PHOTOS_TAB && cat.id !== filterCatalogueId) continue;
    for (const img of cat.images) {
      if (img.imageUrl.trim()) {
        result.push({ ...img, catalogueName: cat.name.trim() || "Catalogue" });
      }
    }
  }
  return result;
}

function GalerieSliderView({ images }: { images: FlatImage[] }) {
  const [lightbox, setLightbox] = useState<FlatImage | null>(null);

  if (images.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
        Aucune photo à afficher pour cette sélection.
      </p>
    );
  }

  return (
    <>
      <Carousel
        key={images.map((i) => i.id).join("|")}
        opts={{ align: "center", loop: images.length > 1 }}
        className="relative w-full px-11 sm:px-14 md:px-16"
      >
        <CarouselContent className="-ml-3 sm:-ml-4">
          {images.map((img) => (
            <CarouselItem key={img.id} className="basis-full pl-3 sm:pl-4">
              <button
                type="button"
                className="group block w-full overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setLightbox(img)}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                  <img
                    src={img.imageUrl}
                    alt={img.title.trim() || "Photo"}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
                {(img.title.trim() || img.description.trim()) && (
                  <div className="space-y-1 p-4 md:p-5">
                    {img.title.trim() ? (
                      <h3 className="text-lg font-semibold text-foreground">{img.title}</h3>
                    ) : null}
                    {img.description.trim() ? (
                      <p className="text-sm text-muted-foreground">{img.description}</p>
                    ) : null}
                  </div>
                )}
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 ? (
          <>
            <CarouselPrevious className="left-0 h-9 w-9 border-border bg-background/95 shadow-sm" />
            <CarouselNext className="right-0 h-9 w-9 border-border bg-background/95 shadow-sm" />
          </>
        ) : null}
      </Carousel>
      <GalerieLightbox image={lightbox} onClose={() => setLightbox(null)} />
    </>
  );
}

function GalerieCatalogueView({ images }: { images: FlatImage[] }) {
  const [lightbox, setLightbox] = useState<FlatImage | null>(null);

  if (images.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
        Aucune photo à afficher pour cette sélection.
      </p>
    );
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img) => (
          <article
            key={img.id}
            className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
          >
            <button
              type="button"
              className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              onClick={() => setLightbox(img)}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={img.imageUrl}
                  alt={img.title.trim() || "Photo"}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            </button>
            <div className="space-y-1.5 p-4">
              {img.title.trim() ? (
                <h3 className="font-semibold leading-snug text-foreground">{img.title}</h3>
              ) : (
                <h3 className="font-medium text-muted-foreground">Sans titre</h3>
              )}
              {img.description.trim() ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{img.description}</p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      <GalerieLightbox image={lightbox} onClose={() => setLightbox(null)} />
    </>
  );
}

function collageSpanClass(index: number): string {
  const pattern = index % 6;
  if (pattern === 0) return "sm:col-span-2 sm:row-span-2";
  if (pattern === 3) return "sm:col-span-2";
  return "";
}

function GalerieCollageView({ images }: { images: FlatImage[] }) {
  const [lightbox, setLightbox] = useState<FlatImage | null>(null);

  if (images.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
        Aucune photo à afficher pour cette sélection.
      </p>
    );
  }

  return (
    <>
      <div className="grid auto-rows-[minmax(140px,auto)] grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {images.map((img, index) => (
          <button
            key={img.id}
            type="button"
            className={cn(
              "group relative overflow-hidden rounded-xl border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              collageSpanClass(index),
            )}
            onClick={() => setLightbox(img)}
          >
            <img
              src={img.imageUrl}
              alt={img.title.trim() || "Photo"}
              className="h-full min-h-[140px] w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {(img.title.trim() || img.description.trim()) && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-8 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                {img.title.trim() ? (
                  <p className="text-sm font-semibold text-white">{img.title}</p>
                ) : null}
                {img.description.trim() ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-white/85">{img.description}</p>
                ) : null}
              </div>
            )}
          </button>
        ))}
      </div>
      <GalerieLightbox image={lightbox} onClose={() => setLightbox(null)} />
    </>
  );
}

function GalerieLightbox({
  image,
  onClose,
}: {
  image: FlatImage | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={image !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        {image ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>{image.title.trim() || "Photo"}</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <img
                src={image.imageUrl}
                alt={image.title.trim() || "Photo"}
                className="max-h-[70vh] w-full object-contain bg-muted"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-3 top-3 h-8 w-8 rounded-full shadow-md"
                aria-label="Fermer"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {(image.title.trim() || image.description.trim()) && (
              <div className="space-y-1 border-t border-border p-4">
                {image.title.trim() ? (
                  <p className="font-semibold text-foreground">{image.title}</p>
                ) : null}
                {image.description.trim() ? (
                  <p className="text-sm text-muted-foreground">{image.description}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">{image.catalogueName}</p>
              </div>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function GalerieDisplay({
  mode,
  images,
}: {
  mode: GalerieDisplayMode;
  images: FlatImage[];
}) {
  if (mode === "slider") return <GalerieSliderView images={images} />;
  if (mode === "collage") return <GalerieCollageView images={images} />;
  return <GalerieCatalogueView images={images} />;
}

type GalerieSectionProps = {
  content?: GalerieContent;
  className?: string;
};

export function GalerieSection({
  content = DEFAULT_GALERIE_CONTENT,
  className,
}: GalerieSectionProps) {
  const catalogues = content.catalogues ?? [];
  const [activeTab, setActiveTab] = useState<string>(ALL_PHOTOS_TAB);

  const tabs = useMemo(() => {
    const items: { id: string; label: string }[] = [{ id: ALL_PHOTOS_TAB, label: "Tous nos photos" }];
    for (const cat of catalogues) {
      if (cat.name.trim() || cat.images.some((i) => i.imageUrl.trim())) {
        items.push({ id: cat.id, label: cat.name.trim() || "Catalogue" });
      }
    }
    return items;
  }, [catalogues]);

  const activeCatalogueDescription = useMemo(() => {
    if (activeTab === ALL_PHOTOS_TAB) return null;
    return catalogues.find((c) => c.id === activeTab)?.description.trim() || null;
  }, [activeTab, catalogues]);

  const filteredImages = useMemo(
    () => flattenImages(catalogues, activeTab),
    [catalogues, activeTab],
  );

  const subtitle = content.subtitle?.trim() ?? "";

  return (
    <div className={cn("mx-auto max-w-6xl px-4 pb-8 pt-1 md:pb-10 md:pt-2 lg:px-8", className)}>
      {subtitle ? (
        <p className="mx-auto mb-5 max-w-3xl text-center text-sm leading-snug text-muted-foreground md:mb-6 md:text-base md:leading-relaxed">
          {subtitle}
        </p>
      ) : null}

      {catalogues.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          Aucun catalogue photo pour l’instant. Configurez la galerie depuis l’éditeur LP.
        </p>
      ) : (
        <>
          <div
            className="mb-6 flex flex-wrap justify-center gap-2 md:mb-8"
            role="tablist"
            aria-label="Catégories de la galerie"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeCatalogueDescription ? (
            <p className="mx-auto mb-5 max-w-2xl text-center text-sm text-muted-foreground md:mb-6">
              {activeCatalogueDescription}
            </p>
          ) : null}

          <GalerieDisplay mode={content.displayMode} images={filteredImages} />
        </>
      )}
    </div>
  );
}
