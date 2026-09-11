import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarDays, Loader2, Search } from "lucide-react";
import { fetchPublishedEvenementsForPublic } from "@/lib/eventsApi";
import type { Evenement } from "@/hooks/useEvenements";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicBreadcrumbs } from "@/components/public/PublicBreadcrumbs";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import { ShareResourceMenu } from "@/components/public/ShareResourceMenu";
import {
  PublicPagedListPagination,
  PublicPagedListToolbar,
  type PublicListViewMode,
  type PublicPageSize,
} from "@/components/public/PublicPagedListControls";
import { buildEventShareUrl } from "@/lib/shareLinks";
import { Input } from "@/components/ui/input";

function filterEventsBySearch(events: Evenement[], search: string): Evenement[] {
  const q = search.trim().toLowerCase();
  if (!q) return events;
  return events.filter(
    (e) =>
      e.titre.toLowerCase().includes(q) ||
      (e.description ?? "").toLowerCase().includes(q),
  );
}

function EventCard({ event }: { event: Evenement }) {
  const href = event.publicSlug ? `/event/${event.publicSlug}` : "#";
  const shareUrl = event.publicSlug ? buildEventShareUrl(event.publicSlug) : "";

  return (
    <li className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-md">
      <Link to={href} className="block min-w-0 flex-1">
        {event.bannerUrl ? (
          <img
            src={event.bannerUrl}
            alt=""
            className="aspect-[16/9] h-auto w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex aspect-[16/9] items-center justify-center bg-muted">
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
    </li>
  );
}

function EventRow({ event }: { event: Evenement }) {
  const href = event.publicSlug ? `/event/${event.publicSlug}` : "#";
  const shareUrl = event.publicSlug ? buildEventShareUrl(event.publicSlug) : "";

  return (
    <li className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-stretch">
      <Link
        to={href}
        className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-lg bg-muted outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring sm:aspect-auto sm:h-28 sm:w-44"
      >
        {event.bannerUrl ? (
          <img src={event.bannerUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <CalendarDays className="h-10 w-10 opacity-25" aria-hidden />
          </div>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <Link to={href} className="outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
            <h3 className="text-lg font-semibold leading-snug text-foreground">{event.titre}</h3>
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {event.createdAt.toLocaleDateString("fr-FR")}
          </p>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {event.description || "Description à venir"}
        </p>
        {shareUrl ? (
          <div className="mt-auto pt-1">
            <ShareResourceMenu
              title={event.titre}
              description={event.description?.trim() || undefined}
              url={shareUrl}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            />
          </div>
        ) : null}
      </div>
    </li>
  );
}

export default function PublicEventsPage() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<PublicListViewMode>("cards");
  const [pageSize, setPageSize] = useState<PublicPageSize>(9);
  const [page, setPage] = useState(0);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["public-events", "published"],
    queryFn: fetchPublishedEvenementsForPublic,
    staleTime: 60_000,
  });

  const filteredEvents = useMemo(
    () => filterEventsBySearch(events, search),
    [events, search],
  );
  const totalCount = filteredEvents.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages - 1);

  const pageItems = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, currentPage, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [pageSize, viewMode, search]);

  return (
    <PublicShell>
      <PublicPageHero
        title="Événements"
        description="Découvrez les événements publiés du REMESS et accédez à leur page publique pour vous inscrire."
      />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-8 md:py-10 lg:px-8">
        <PublicBreadcrumbs items={[{ label: "Accueil", to: "/" }, { label: "Événements" }]} />

        {isLoading ? (
          <div className="flex justify-center py-20 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
          </div>
        ) : events.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
            Aucun événement publié pour le moment.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative min-w-[14rem] max-w-xl flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un événement…"
                  aria-label="Rechercher un événement"
                  autoComplete="off"
                />
              </div>
              <PublicPagedListToolbar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                pageSize={pageSize}
                onPageSizeChange={(n) => {
                  if (n === 3 || n === 9 || n === 30) setPageSize(n);
                }}
              />
            </div>

            {totalCount === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
                Aucun événement ne correspond à votre recherche.
              </p>
            ) : (
              <>
                {viewMode === "cards" ? (
                  <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pageItems.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-3">
                    {pageItems.map((event) => (
                      <EventRow key={event.id} event={event} />
                    ))}
                  </ul>
                )}

                <PublicPagedListPagination
                  page={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  itemLabel="événement"
                  ariaLabel="Pagination des événements"
                />
              </>
            )}
          </>
        )}
      </main>
    </PublicShell>
  );
}
