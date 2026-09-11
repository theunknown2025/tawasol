import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { BarometreChartCard } from "@/components/public/BarometreChartCard";
import { fetchPublishedBarometreDatasets } from "@/pages/super-admin/LP_Manager/BarometreStats/barometreDatasetsApi";
import { cn } from "@/lib/utils";

type Props = {
  hideMainTitle?: boolean;
};

export function BarometreDonneesLandingSection({ hideMainTitle = false }: Props) {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["barometre-datasets-published"],
    queryFn: fetchPublishedBarometreDatasets,
    staleTime: 60_000,
  });

  return (
    <div
      className={cn(
        "mx-auto max-w-6xl px-4 lg:px-8",
        hideMainTitle ? "pb-8 pt-0 md:pb-10" : "py-10 md:py-14",
      )}
    >
      {!hideMainTitle ? (
        <header className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Baromètre
          </h2>
          <p className="mt-3 text-pretty text-base text-muted-foreground md:text-lg">
            Découvrir les indicateurs clés du secteur coopératif.
          </p>
        </header>
      ) : (
        <p className="mx-auto mb-8 max-w-2xl text-balance text-center text-base text-muted-foreground md:mb-10 md:text-lg">
          Découvrir les indicateurs clés du secteur coopératif.
        </p>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
          <p className="text-sm">Chargement…</p>
        </div>
      ) : isError || data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Les graphiques du baromètre seront bientôt disponibles.
        </p>
      ) : (
        <Carousel opts={{ align: "start", loop: data.length > 1 }} className="w-full">
          <CarouselContent className="-ml-3 md:-ml-4">
            {data.map((dataset) => (
              <CarouselItem
                key={dataset.id}
                className="pl-3 md:basis-1/2 md:pl-4 lg:basis-1/3"
              >
                <BarometreChartCard dataset={dataset} compact />
              </CarouselItem>
            ))}
          </CarouselContent>
          {data.length > 1 ? (
            <>
              <CarouselPrevious className="left-0" />
              <CarouselNext className="right-0" />
            </>
          ) : null}
        </Carousel>
      )}

      <div className="mt-8 flex justify-center md:mt-10">
        <Button asChild size="lg" className="min-w-[220px] rounded-full px-8">
          <Link to="/barometre">Découvrir notre baromètre</Link>
        </Button>
      </div>
    </div>
  );
}
