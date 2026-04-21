import { CalendarDays, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Evenement } from "@/hooks/useEvenements";

interface EventsCardsGridProps {
  events: Evenement[];
  isLoading: boolean;
  onView: (e: Evenement) => void;
  onSubscribe: (e: Evenement) => void;
  onViewOrganizer: (e: Evenement) => void;
}

export function EventsCardsGrid({
  events,
  isLoading,
  onView,
  onSubscribe,
  onViewOrganizer,
}: EventsCardsGridProps) {
  if (isLoading) {
    return (
      <p className="text-muted-foreground text-sm py-12 text-center">
        Chargement...
      </p>
    );
  }
  if (events.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-12 text-center">
        Aucun événement publié.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((evt) => (
        <Card
          key={evt.id}
          className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onView(evt)}
        >
          <div className="aspect-video bg-muted relative">
            {evt.bannerUrl ? (
              <img
                src={evt.bannerUrl}
                alt={evt.titre}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <CalendarDays size={48} className="text-muted-foreground/50" />
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg line-clamp-2 mb-1">{evt.titre}</h3>
            <p className="text-xs text-muted-foreground">
              {evt.createdAt.toLocaleDateString("fr-FR")}
            </p>
            {evt.duree && (
              <p className="text-sm text-muted-foreground mt-1">{evt.duree}</p>
            )}
            {evt.deadlineInscription && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Inscription avant le{" "}
                {evt.deadlineInscription.toLocaleDateString("fr-FR")}
              </p>
            )}
          </CardContent>
          <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="flex-1 min-w-0"
              onClick={(e) => {
                e.stopPropagation();
                onSubscribe(evt);
              }}
            >
              <UserPlus size={14} className="mr-1.5" />
              S'inscrire
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewOrganizer(evt);
              }}
            >
              <Users size={14} className="mr-1.5" />
              Organisateur
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
