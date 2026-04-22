import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { fetchPublishedEvenementsForPublic } from "@/lib/eventsApi";

export default function PublicEventsPage() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["public-events", "published"],
    queryFn: fetchPublishedEvenementsForPublic,
    staleTime: 60_000,
  });

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Naviguer les événements</h1>
          <p className="text-sm text-muted-foreground">
            Découvrez les événements publiés et accédez à leur page publique.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement des evenements...</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun evenement publie pour le moment.</p>
        ) : (
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
        )}
      </div>
    </div>
  );
}
