import { CalendarDays, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Evenement } from "@/hooks/useEvenements";
import type { MySubscription } from "@/hooks/useEventSubscriptions";

interface MesInscriptionsProps {
  subscriptions: MySubscription[];
  isLoading: boolean;
  onViewEvent: (e: Evenement) => void;
  onDeleteSubscription: (id: string) => void | Promise<void>;
  isDeleting: boolean;
}

export function MesInscriptions({
  subscriptions,
  isLoading,
  onViewEvent,
  onDeleteSubscription,
  isDeleting,
}: MesInscriptionsProps) {
  if (isLoading) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        Chargement...
      </p>
    );
  }
  if (subscriptions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        Vous n'êtes inscrit à aucun événement.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {subscriptions.map((sub) => (
        <Card
          key={sub.id}
          className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onViewEvent(sub.event)}
        >
          <div className="aspect-video bg-muted relative">
            {sub.event.bannerUrl ? (
              <img
                src={sub.event.bannerUrl}
                alt={sub.event.titre}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <CalendarDays size={40} className="text-muted-foreground/50" />
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold line-clamp-2">{sub.event.titre}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {sub.event.createdAt.toLocaleDateString("fr-FR")}
            </p>
            <Badge
              variant={
                sub.status === "approved"
                  ? "default"
                  : sub.status === "rejected"
                    ? "destructive"
                    : "secondary"
              }
              className="mt-2 text-xs"
            >
              {sub.status === "approved"
                ? "Approuvé"
                : sub.status === "rejected"
                  ? "Rejeté"
                  : "En attente"}
            </Badge>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onViewEvent(sub.event);
              }}
            >
              <Eye size={14} className="mr-1" />
              Voir
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSubscription(sub.id);
              }}
              disabled={isDeleting}
            >
              <Trash2 size={14} className="mr-1" />
              Annuler
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
