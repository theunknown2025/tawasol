import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EventsCardsGrid } from "./EventsCardsGrid";
import { OrganizerDialog } from "./OrganizerDialog";
import type { Evenement } from "@/hooks/useEvenements";

interface AllEventsProps {
  events: Evenement[];
  isLoading: boolean;
  onView: (e: Evenement) => void;
  onSubscribe: (e: Evenement) => void;
}

export function AllEvents({
  events,
  isLoading,
  onView,
  onSubscribe,
}: AllEventsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [organizerEvt, setOrganizerEvt] = useState<Evenement | null>(null);

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

  return (
    <>
      <div className="space-y-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px] space-y-1">
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
        {filteredEvents.length !== events.length && (
          <p className="text-sm text-muted-foreground">
            {filteredEvents.length} résultat
            {filteredEvents.length !== 1 ? "s" : ""} sur {events.length}
          </p>
        )}
      </div>
      <EventsCardsGrid
        events={filteredEvents}
        isLoading={isLoading}
        onView={onView}
        onSubscribe={onSubscribe}
        onViewOrganizer={setOrganizerEvt}
      />
      <OrganizerDialog event={organizerEvt} onClose={() => setOrganizerEvt(null)} />
    </>
  );
}
