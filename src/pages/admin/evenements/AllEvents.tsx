import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PublicPagedListPagination,
  PublicPagedListToolbar,
  type PublicListViewMode,
} from "@/components/public/PublicPagedListControls";
import { EventsCardsGrid } from "./EventsCardsGrid";
import { OrganizerDialog } from "./OrganizerDialog";
import type { Evenement } from "@/hooks/useEvenements";

const TAWASOL_EVENT_PAGE_SIZES = [9, 18, 36] as const;
type TawasolEventPageSize = (typeof TAWASOL_EVENT_PAGE_SIZES)[number];

interface AllEventsProps {
  events: Evenement[];
  isLoading: boolean;
  onView: (e: Evenement) => void;
  onSubscribe: (e: Evenement) => void;
  onPublish?: (id: string) => void;
  onUnpublish?: (id: string) => void;
  canManagePublish?: boolean;
  isUpdatingStatus?: boolean;
}

export function AllEvents({
  events,
  isLoading,
  onView,
  onSubscribe,
  onPublish,
  onUnpublish,
  canManagePublish = false,
  isUpdatingStatus = false,
}: AllEventsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [organizerEvt, setOrganizerEvt] = useState<Evenement | null>(null);
  const [viewMode, setViewMode] = useState<PublicListViewMode>("cards");
  const [pageSize, setPageSize] = useState<TawasolEventPageSize>(9);
  const [page, setPage] = useState(0);

  const filteredEvents = useMemo(() => {
    let list = events;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.titre.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.authorName.toLowerCase().includes(q),
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      list = list.filter((e) => e.createdAt >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((e) => e.createdAt <= to);
    }
    return list;
  }, [events, searchQuery, dateFrom, dateTo]);

  const totalCount = filteredEvents.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages - 1);

  const pageItems = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, currentPage, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [pageSize, viewMode, searchQuery, dateFrom, dateTo]);

  return (
    <>
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1 space-y-1">
            <Label htmlFor="search-events" className="text-xs text-muted-foreground">
              Rechercher
            </Label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="search-events"
                placeholder="Titre, description, organisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="date-from" className="text-xs text-muted-foreground">
              Du
            </Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="date-to" className="text-xs text-muted-foreground">
              Au
            </Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setDateFrom("");
              setDateTo("");
            }}
          >
            Réinitialiser
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {filteredEvents.length !== events.length ? (
            <p className="text-sm text-muted-foreground">
              {filteredEvents.length} résultat
              {filteredEvents.length !== 1 ? "s" : ""} sur {events.length}
            </p>
          ) : (
            <span className="hidden sm:block" />
          )}
          <PublicPagedListToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            pageSize={pageSize}
            onPageSizeChange={(n) => {
              if (n === 9 || n === 18 || n === 36) setPageSize(n);
            }}
            pageSizeOptions={TAWASOL_EVENT_PAGE_SIZES}
          />
        </div>
      </div>

      <EventsCardsGrid
        events={pageItems}
        isLoading={isLoading}
        viewMode={viewMode}
        onView={onView}
        onSubscribe={onSubscribe}
        onViewOrganizer={setOrganizerEvt}
        onPublish={onPublish}
        onUnpublish={onUnpublish}
        canManagePublish={canManagePublish}
        isUpdatingStatus={isUpdatingStatus}
      />

      {!isLoading && totalCount > 0 ? (
        <div className="mt-6">
          <PublicPagedListPagination
            page={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
            itemLabel="événement"
            ariaLabel="Pagination des événements Tawasol"
          />
        </div>
      ) : null}

      <OrganizerDialog event={organizerEvt} onClose={() => setOrganizerEvt(null)} />
    </>
  );
}
