import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { fetchPublishedEvenementsForPublic } from "@/lib/eventsApi";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import { ShareResourceMenu } from "@/components/public/ShareResourceMenu";
import { buildEventShareUrl } from "@/lib/shareLinks";

export default function PublicEventsPage() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["public-events", "published"],
    queryFn: fetchPublishedEvenementsForPublic,
    staleTime: 60_000,
  });

  return (
    <PublicShell>
      <PublicPageHero
        title="Événements"
        description="Découvrez les événements publiés du REMESS et accédez à leur page publique pour vous inscrire."
      />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-8 md:py-10">
        <PublicBreadcrumbs items={[{ label: "Accueil", to: "/" }, { label: "Événements" }]} />

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement des événements…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun événement publié pour le moment.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const href = event.publicSlug ? `/event/${event.publicSlug}` : "#";
              const shareUrl = event.publicSlug ? buildEventShareUrl(event.publicSlug) : "";
              return (
                <div
                  key={event.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-md"
                >
                  <Link to={href} className="block min-w-0 flex-1">
                    {event.bannerUrl ? (
                      <img
                        src={event.bannerUrl}
                        alt={event.titre}
                        className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-44 items-center justify-center bg-muted">
                        <CalendarDays className="text-muted-foreground" aria-hidden />
                      </div>
                    )}
                    <div className="space-y-2 p-4">
                      <h3 className="line-clamp-2 font-semibold">{event.titre}</h3>
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {event.description || "Description à venir"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.createdAt.toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </Link>
                  {shareUrl ? (
                    <div className="border-t border-border p-3">
                      <ShareResourceMenu
                        title={event.titre}
                        description={event.description?.trim() || undefined}
                        url={shareUrl}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </PublicShell>
  );
}
