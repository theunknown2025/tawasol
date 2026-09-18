import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
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
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Evenement } from "@/hooks/useEvenements";
import type { EventSubscription } from "@/hooks/useEventSubscriptions";
import type { EventFormRegistration } from "@/hooks/useEventFormRegistrations";
import { SignedStorageFileAccess } from "@/components/files/SignedStorageFileAccess";
import { getEventRegistrationFileSignedUrl } from "@/lib/eventsApi";
import { formatEventDateRange } from "./eventDates";

function looksLikeFakePath(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return /fakepath/i.test(value) || /^[A-Za-z]:\\/.test(value);
}

function RegistrationAnswers({
  reg,
  getSignedUrl,
}: {
  reg: EventFormRegistration;
  getSignedUrl: (path: string) => Promise<string>;
}) {
  const keys = [
    ...new Set([...Object.keys(reg.answers), ...Object.keys(reg.fileUploads ?? {})]),
  ];

  if (keys.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune réponse.</p>;
  }

  return (
    <div className="space-y-3">
      {keys.map((key) => {
        const file = reg.fileUploads?.[key];
        const value = reg.answers[key];
        return (
          <div key={key} className="rounded-md border border-border bg-background p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">{key}</p>
            {file?.path ? (
              <SignedStorageFileAccess
                path={file.path}
                fileName={file.fileName || String(value || "document")}
                getSignedUrl={getSignedUrl}
                inlinePreview
              />
            ) : looksLikeFakePath(value) ? (
              <p className="text-sm text-destructive">
                Fichier non téléversé (inscription ancienne) — demandez une nouvelle soumission.
              </p>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{String(value ?? "—")}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

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
  const getSignedUrl = useCallback(
    (path: string) => getEventRegistrationFileSignedUrl(path),
    []
  );

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
          <Card
            key={evt.id}
            className={cn(
              "overflow-hidden",
              evt.status !== "published" &&
                "border-amber-400 bg-amber-50/80 dark:border-amber-500/60 dark:bg-amber-950/30",
            )}
          >
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
                      {(evt.eventDateStart || evt.eventDateEnd) &&
                        ` • ${formatEventDateRange(evt.eventDateStart, evt.eventDateEnd)}`}
                    </p>
                  </div>
                </div>
              </div>
              <Badge
                variant={evt.status === "published" ? "default" : "secondary"}
                className={cn(
                  "shrink-0",
                  evt.status !== "published" &&
                    "border-0 bg-amber-400 text-amber-950 hover:bg-amber-400",
                )}
              >
                {evt.status === "published" ? "Publié" : "Non publié"}
              </Badge>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" asChild title="Modifier">
                  <Link to={`/admin/evenements/edit/${evt.id}`}>
                    <Pencil size={16} />
                  </Link>
                </Button>
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
                        <h4 className="mb-3 font-medium">Réponses du formulaire</h4>
                        <Accordion type="single" collapsible className="space-y-2">
                          {regs.map((reg) => (
                            <AccordionItem
                              key={reg.id}
                              value={reg.id}
                              className="rounded-lg border border-border px-3"
                            >
                              <AccordionTrigger className="hover:no-underline py-3">
                                <div className="flex flex-1 flex-wrap items-center gap-2 pr-3 text-left">
                                  <span className="font-medium">{reg.applicantName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {reg.applicantEmail}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {reg.createdAt.toLocaleDateString("fr-FR")}
                                  </span>
                                  <Badge
                                    variant={
                                      reg.status === "approved"
                                        ? "default"
                                        : reg.status === "rejected"
                                          ? "destructive"
                                          : "secondary"
                                    }
                                    className="ml-auto"
                                  >
                                    {reg.status === "approved"
                                      ? "Accepté"
                                      : reg.status === "rejected"
                                        ? "Rejeté"
                                        : "En attente"}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-4">
                                <div className="space-y-4 border-t border-border pt-3">
                                  <RegistrationAnswers reg={reg} getSignedUrl={getSignedUrl} />
                                  {reg.status === "pending" && (
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        className="gap-1.5"
                                        disabled={isUpdatingRegistrations}
                                        onClick={() => onApproveRegistration(reg.id)}
                                      >
                                        <Check size={16} />
                                        Accepter
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="gap-1.5"
                                        disabled={isUpdatingRegistrations}
                                        onClick={() => onRejectRegistration(reg.id)}
                                      >
                                        <XCircle size={16} />
                                        Rejeter
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
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
    </div>
  );
}
