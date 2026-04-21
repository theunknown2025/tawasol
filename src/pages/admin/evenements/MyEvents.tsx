import { useState } from "react";
import {
  CalendarDays,
  Eye,
  Trash2,
  SendHorizontal,
  EyeOff,
  Check,
  XCircle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Evenement } from "@/hooks/useEvenements";
import type { EventSubscription } from "@/hooks/useEventSubscriptions";
import type { EventFormRegistration } from "@/hooks/useEventFormRegistrations";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MyEventsProps {
  events: Evenement[];
  isLoading: boolean;
  subscriptionsByEvent: Record<string, EventSubscription[]>;
  registrationsByEvent: Record<string, EventFormRegistration[]>;
  onView: (e: Evenement) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  onApprove: (id: string) => void | Promise<void>;
  onReject: (id: string) => void | Promise<void>;
  onApproveRegistration: (id: string) => void | Promise<void>;
  onRejectRegistration: (id: string) => void | Promise<void>;
  isUpdating: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  isUpdatingRegistrations: boolean;
}

export function MyEvents({
  events,
  isLoading,
  subscriptionsByEvent,
  registrationsByEvent,
  onView,
  onDelete,
  onPublish,
  onUnpublish,
  onApprove,
  onReject,
  onApproveRegistration,
  onRejectRegistration,
  isUpdating,
  isApproving,
  isRejecting,
  isUpdatingRegistrations,
}: MyEventsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [registrationDetails, setRegistrationDetails] = useState<EventFormRegistration | null>(null);

  if (isLoading) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        Chargement...
      </p>
    );
  }
  if (events.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        Aucun événement. Créez-en un nouveau.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((evt) => {
        const subs = subscriptionsByEvent[evt.id] ?? [];
        const regs = registrationsByEvent[evt.id] ?? [];
        const pendingCount = subs.filter((s) => s.status === "pending").length;
        const isExpanded = expandedId === evt.id;

        return (
          <Card key={evt.id} className="overflow-hidden">
            <div className="p-4 flex flex-wrap items-center gap-4">
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => onView(evt)}
              >
                <div className="flex items-center gap-3">
                  {evt.bannerUrl ? (
                    <img
                      src={evt.bannerUrl}
                      alt=""
                      className="w-12 h-12 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                      <CalendarDays size={20} className="text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{evt.titre}</h3>
                    <p className="text-xs text-muted-foreground">
                      {evt.createdAt.toLocaleDateString("fr-FR")}
                      {evt.duree && ` • ${evt.duree}`}
                    </p>
                  </div>
                </div>
              </div>
              <Badge
                variant={evt.status === "published" ? "default" : "secondary"}
                className="shrink-0"
              >
                {evt.status === "published" ? "Publié" : "Brouillon"}
              </Badge>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => onView(evt)} title="Voir">
                  <Eye size={16} />
                </Button>
                {evt.publicSlug && (
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Copier lien public"
                    onClick={() => {
                      const url = `${window.location.origin}/event/${evt.publicSlug}`;
                      void navigator.clipboard.writeText(url);
                    }}
                  >
                    <Share2 size={16} />
                  </Button>
                )}
                {evt.status === "draft" ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPublish(evt.id)}
                    disabled={isUpdating}
                    title="Publier"
                    className="text-primary"
                  >
                    <SendHorizontal size={16} />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onUnpublish(evt.id)}
                    disabled={isUpdating}
                    title="Dépublier"
                  >
                    <EyeOff size={16} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(evt.id)}
                  title="Supprimer"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            {(subs.length > 0 || regs.length > 0) && (
              <>
                <button
                  type="button"
                  className="w-full px-4 py-2 flex items-center justify-between gap-2 bg-muted/50 hover:bg-muted/70 transition-colors text-left"
                  onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <ClipboardList size={16} />
                    {subs.length + regs.length} inscription{subs.length + regs.length > 1 ? "s" : ""}
                    {pendingCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {pendingCount} en attente
                      </Badge>
                    )}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t">
                    {regs.length > 0 && (
                      <div className="py-4">
                        <h4 className="font-medium mb-2">Reponses du formulaire</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nom</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead className="w-[220px] text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {regs.map((reg) => (
                              <TableRow key={reg.id}>
                                <TableCell className="font-medium">{reg.applicantName}</TableCell>
                                <TableCell>{reg.applicantEmail}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {reg.createdAt.toLocaleDateString("fr-FR")}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={reg.status === "approved" ? "default" : reg.status === "rejected" ? "destructive" : "secondary"}>
                                    {reg.status === "approved" ? "Accepte" : reg.status === "rejected" ? "Rejete" : "En attente"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => setRegistrationDetails(reg)}>
                                      Voir reponses
                                    </Button>
                                    {reg.status === "pending" && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-green-600"
                                          disabled={isUpdatingRegistrations}
                                          onClick={() => onApproveRegistration(reg.id)}
                                        >
                                          <Check size={16} />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-destructive"
                                          disabled={isUpdatingRegistrations}
                                          onClick={() => onRejectRegistration(reg.id)}
                                        >
                                          <XCircle size={16} />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {subs.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Inscrit</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="w-[140px] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subs.map((sub) => (
                            <TableRow key={sub.id}>
                              <TableCell className="font-medium">{sub.userName}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {sub.createdAt.toLocaleDateString("fr-FR")}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    sub.status === "approved"
                                      ? "default"
                                      : sub.status === "rejected"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {sub.status === "approved"
                                    ? "Approuvé"
                                    : sub.status === "rejected"
                                      ? "Rejeté"
                                      : "En attente"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {sub.status === "pending" && (
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onApprove(sub.id)}
                                      disabled={isApproving || isRejecting}
                                      className="text-green-600 hover:text-green-600"
                                      title="Approuver"
                                    >
                                      <Check size={16} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onReject(sub.id)}
                                      disabled={isApproving || isRejecting}
                                      className="text-destructive"
                                      title="Rejeter"
                                    >
                                      <XCircle size={16} />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </>
            )}
          </Card>
        );
      })}

      <Dialog open={!!registrationDetails} onOpenChange={() => setRegistrationDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reponses du formulaire</DialogTitle>
          </DialogHeader>
          {registrationDetails && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {registrationDetails.applicantName} - {registrationDetails.applicantEmail}
              </p>
              {Object.entries(registrationDetails.answers).length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune reponse.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(registrationDetails.answers).map(([key, value]) => (
                    <div key={key} className="rounded-md border border-border p-2">
                      <p className="text-xs text-muted-foreground">{key}</p>
                      <p className="text-sm">{String(value)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
