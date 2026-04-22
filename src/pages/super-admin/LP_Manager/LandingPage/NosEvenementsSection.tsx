import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { fetchPublishedEvenementsForPublic } from "@/lib/eventsApi";
import { Button } from "@/components/ui/button";

export function NosEvenementsSection() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["landing", "nos-evenements", "published"],
    queryFn: fetchPublishedEvenementsForPublic,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted-foreground lg:px-8">
        Chargement des evenements...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted-foreground lg:px-8">
        Aucun evenement publie pour le moment.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Link
            key={event.id}
            to={event.publicSlug ? `/event/${event.publicSlug}` : "#"}
            className="group block overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-md"
          >
            {event.bannerUrl ? (
              <img
                src={event.bannerUrl}
                alt={event.titre}
                className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-44 items-center justify-center bg-muted">
                <CalendarDays className="text-muted-foreground" />
              </div>
            )}
            <div className="space-y-2 p-4">
              <h3 className="line-clamp-2 font-semibold">{event.titre}</h3>
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {event.description || "Description a venir"}
              </p>
              <p className="text-xs text-muted-foreground">
                {event.createdAt.toLocaleDateString("fr-FR")}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <Button asChild size="lg" className="min-w-[16rem] gap-2">
          <Link to="/events">Naviguer les evenements</Link>
        </Button>
      </div>
    </div>
  );
}
