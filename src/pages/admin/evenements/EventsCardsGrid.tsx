import { CalendarDays, EyeOff, SendHorizontal, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Evenement } from "@/hooks/useEvenements";
import type { PublicListViewMode } from "@/components/public/PublicPagedListControls";
import { formatEventDateRange, formatFrDate } from "./eventDates";

interface EventsCardsGridProps {
  events: Evenement[];
  isLoading: boolean;
  viewMode?: PublicListViewMode;
  onView: (e: Evenement) => void;
  onSubscribe: (e: Evenement) => void;
  onViewOrganizer: (e: Evenement) => void;
  /** Super admin: publish / unpublish any event */
  onPublish?: (id: string) => void;
  onUnpublish?: (id: string) => void;
  canManagePublish?: boolean;
  isUpdatingStatus?: boolean;
}

function PublishActions({
  evt,
  canManagePublish,
  isUpdatingStatus,
  onPublish,
  onUnpublish,
  className,
}: {
  evt: Evenement;
  canManagePublish: boolean;
  isUpdatingStatus: boolean;
  onPublish?: (id: string) => void;
  onUnpublish?: (id: string) => void;
  className?: string;
}) {
  if (!canManagePublish) return null;
  const isUnpublished = evt.status !== "published";
  return isUnpublished ? (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className={cn("h-8 w-8 shrink-0 shadow-sm text-primary", className)}
      title="Publier"
      disabled={isUpdatingStatus}
      onClick={(e) => {
        e.stopPropagation();
        onPublish?.(evt.id);
      }}
    >
      <SendHorizontal size={16} />
    </Button>
  ) : (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className={cn("h-8 w-8 shrink-0 shadow-sm", className)}
      title="Dépublier"
      disabled={isUpdatingStatus}
      onClick={(e) => {
        e.stopPropagation();
        onUnpublish?.(evt.id);
      }}
    >
      <EyeOff size={16} />
    </Button>
  );
}

function EventCard({
  evt,
  onView,
  onSubscribe,
  onViewOrganizer,
  onPublish,
  onUnpublish,
  canManagePublish,
  isUpdatingStatus,
}: {
  evt: Evenement;
  onView: (e: Evenement) => void;
  onSubscribe: (e: Evenement) => void;
  onViewOrganizer: (e: Evenement) => void;
  onPublish?: (id: string) => void;
  onUnpublish?: (id: string) => void;
  canManagePublish: boolean;
  isUpdatingStatus: boolean;
}) {
  const isUnpublished = evt.status !== "published";
  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer hover:shadow-md transition-shadow",
        isUnpublished && "border-amber-400 bg-amber-50/80 dark:border-amber-500/60 dark:bg-amber-950/30",
      )}
      onClick={() => onView(evt)}
    >
      <div className="aspect-video bg-muted relative">
        {evt.bannerUrl ? (
          <img
            src={evt.bannerUrl}
            alt={evt.titre}
            className={cn("w-full h-full object-cover", isUnpublished && "opacity-80")}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CalendarDays size={48} className="text-muted-foreground/50" />
          </div>
        )}
        {isUnpublished ? (
          <Badge className="absolute left-2 top-2 border-0 bg-amber-400 text-amber-950 hover:bg-amber-400">
            Non publié
          </Badge>
        ) : null}
        <PublishActions
          evt={evt}
          canManagePublish={canManagePublish}
          isUpdatingStatus={isUpdatingStatus}
          onPublish={onPublish}
          onUnpublish={onUnpublish}
          className="absolute right-2 top-2"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2 mb-1">{evt.titre}</h3>
        <p className="text-xs text-muted-foreground">
          {evt.createdAt.toLocaleDateString("fr-FR")}
        </p>
        {(evt.eventDateStart || evt.eventDateEnd) && (
          <p className="text-sm text-muted-foreground mt-1">
            {formatEventDateRange(evt.eventDateStart, evt.eventDateEnd)}
          </p>
        )}
        {evt.deadlineInscription && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Inscription avant le {formatFrDate(evt.deadlineInscription)}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
        {!isUnpublished ? (
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
        ) : null}
        <Button
          variant="outline"
          size="sm"
          className={cn(isUnpublished && "flex-1")}
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
  );
}

function EventRow({
  evt,
  onView,
  onSubscribe,
  onViewOrganizer,
  onPublish,
  onUnpublish,
  canManagePublish,
  isUpdatingStatus,
}: {
  evt: Evenement;
  onView: (e: Evenement) => void;
  onSubscribe: (e: Evenement) => void;
  onViewOrganizer: (e: Evenement) => void;
  onPublish?: (id: string) => void;
  onUnpublish?: (id: string) => void;
  canManagePublish: boolean;
  isUpdatingStatus: boolean;
}) {
  const isUnpublished = evt.status !== "published";
  return (
    <Card
      className={cn(
        "cursor-pointer overflow-hidden transition-shadow hover:shadow-md",
        isUnpublished && "border-amber-400 bg-amber-50/80 dark:border-amber-500/60 dark:bg-amber-950/30",
      )}
      onClick={() => onView(evt)}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch">
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:aspect-auto sm:h-28 sm:w-44">
          {evt.bannerUrl ? (
            <img
              src={evt.bannerUrl}
              alt=""
              className={cn("h-full w-full object-cover", isUnpublished && "opacity-80")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <CalendarDays className="h-10 w-10 opacity-25" aria-hidden />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold leading-snug text-foreground">{evt.titre}</h3>
                {isUnpublished ? (
                  <Badge className="border-0 bg-amber-400 text-amber-950 hover:bg-amber-400">
                    Non publié
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {evt.createdAt.toLocaleDateString("fr-FR")}
                {(evt.eventDateStart || evt.eventDateEnd) &&
                  ` · ${formatEventDateRange(evt.eventDateStart, evt.eventDateEnd)}`}
              </p>
            </div>
            <PublishActions
              evt={evt}
              canManagePublish={canManagePublish}
              isUpdatingStatus={isUpdatingStatus}
              onPublish={onPublish}
              onUnpublish={onUnpublish}
            />
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {evt.description || "Description à venir"}
          </p>
          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            {!isUnpublished ? (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSubscribe(evt);
                }}
              >
                <UserPlus size={14} className="mr-1.5" />
                S'inscrire
              </Button>
            ) : null}
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
          </div>
        </div>
      </div>
    </Card>
  );
}

export function EventsCardsGrid({
  events,
  isLoading,
  viewMode = "cards",
  onView,
  onSubscribe,
  onViewOrganizer,
  onPublish,
  onUnpublish,
  canManagePublish = false,
  isUpdatingStatus = false,
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
        Aucun événement.
      </p>
    );
  }

  const itemProps = {
    onView,
    onSubscribe,
    onViewOrganizer,
    onPublish,
    onUnpublish,
    canManagePublish,
    isUpdatingStatus,
  };

  if (viewMode === "rows") {
    return (
      <div className="space-y-3">
        {events.map((evt) => (
          <EventRow key={evt.id} evt={evt} {...itemProps} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((evt) => (
        <EventCard key={evt.id} evt={evt} {...itemProps} />
      ))}
    </div>
  );
}
