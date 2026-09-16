import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, FileSpreadsheet, X } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  approveCartographieInfoRequest,
  fetchCartographieInfoRequests,
  rejectCartographieInfoRequest,
} from "./cartographieInfoRequestApi";
import {
  CARTOGRAPHIE_INFO_STATUS_LABELS,
  labelForInfoField,
  type CartographieInfoRequest,
  type CartographieInfoRequestStatus,
} from "./cartographieInfoRequestTypes";

function statusBadgeVariant(
  status: CartographieInfoRequestStatus,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "approved") return "default";
  if (status === "rejected") return "destructive";
  return "secondary";
}

function RequestRow({
  request,
  onApprove,
  onReject,
  busyId,
}: {
  request: CartographieInfoRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  busyId: string | null;
}) {
  const busy = busyId === request.id;
  return (
    <AccordionItem value={request.id}>
      <AccordionTrigger className="px-1 text-left hover:no-underline">
        <div className="flex flex-1 flex-wrap items-center gap-2 pr-3">
          <span className="font-medium text-foreground">{request.fullName}</span>
          <span className="text-xs text-muted-foreground">{request.email}</span>
          <Badge variant={statusBadgeVariant(request.status)} className="ml-auto">
            {CARTOGRAPHIE_INFO_STATUS_LABELS[request.status]}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pb-4">
        <p className="text-xs text-muted-foreground">
          Reçue le {new Date(request.createdAt).toLocaleString("fr-FR")}
          {request.reviewedAt
            ? ` · Traitée le ${new Date(request.reviewedAt).toLocaleString("fr-FR")}`
            : ""}
        </p>

        <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Tél.</p>
            <p>{request.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Email</p>
            <p className="break-all">{request.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Fonction</p>
            <p>{request.fonction || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Établissement</p>
            <p>{request.etablissement || "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold text-muted-foreground">Éléments demandés</p>
            <ul className="mt-1 list-inside list-disc">
              {request.requestedFields.map((key) => (
                <li key={key}>{labelForInfoField(key)}</li>
              ))}
            </ul>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold text-muted-foreground">Description de l&apos;usage</p>
            <p className="mt-1 whitespace-pre-wrap">{request.usageDescription || "—"}</p>
          </div>
          {request.emailSentAt ? (
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-muted-foreground">E-mail Excel</p>
              <p className="flex items-center gap-1.5 text-sm text-foreground">
                <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden />
                Envoyé le {new Date(request.emailSentAt).toLocaleString("fr-FR")}
              </p>
            </div>
          ) : null}
          {request.emailError ? (
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-destructive">Erreur d&apos;envoi</p>
              <p className="text-sm text-destructive">{request.emailError}</p>
            </div>
          ) : null}
        </div>

        {request.status === "pending" ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={busy}
              onClick={() => onApprove(request.id)}
            >
              <Check className="h-4 w-4" aria-hidden />
              Approuver et envoyer l&apos;Excel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={busy}
              onClick={() => onReject(request.id)}
            >
              <X className="h-4 w-4" aria-hidden />
              Rejeter
            </Button>
          </div>
        ) : null}
      </AccordionContent>
    </AccordionItem>
  );
}

function RequestList({
  requests,
  emptyLabel,
  onApprove,
  onReject,
  busyId,
}: {
  requests: CartographieInfoRequest[];
  emptyLabel: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  busyId: string | null;
}) {
  if (requests.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <Accordion type="multiple" className="w-full">
      {requests.map((r) => (
        <RequestRow
          key={r.id}
          request={r}
          onApprove={onApprove}
          onReject={onReject}
          busyId={busyId}
        />
      ))}
    </Accordion>
  );
}

export default function CartographieInfoRequestsPage() {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: requests = [], isLoading, isError, error } = useQuery({
    queryKey: ["cartographie-info-requests"],
    queryFn: fetchCartographieInfoRequests,
  });

  const pending = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);
  const approved = useMemo(() => requests.filter((r) => r.status === "approved"), [requests]);
  const rejected = useMemo(() => requests.filter((r) => r.status === "rejected"), [requests]);

  const approveMutation = useMutation({
    mutationFn: approveCartographieInfoRequest,
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["cartographie-info-requests"] });
      if (result.ok) toast.success(result.message ?? "Demande approuvée.");
      else toast.error(result.error ?? "Échec de l'approbation.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectCartographieInfoRequest,
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cartographie-info-requests"] });
      toast.success("Demande rejetée.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });

  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Demandes d&apos;information</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Demandes d&apos;export des données cartographie. L&apos;approbation envoie un fichier Excel
          des éléments initiaux demandés au demandeur.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : isError ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Impossible de charger les demandes."}
        </p>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">En attente ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Approuvées ({approved.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejetées ({rejected.length})</TabsTrigger>
            <TabsTrigger value="all">Toutes ({requests.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-4">
            <RequestList
              requests={pending}
              emptyLabel="Aucune demande en attente."
              onApprove={(id) => approveMutation.mutate(id)}
              onReject={(id) => rejectMutation.mutate(id)}
              busyId={busyId}
            />
          </TabsContent>
          <TabsContent value="approved" className="mt-4">
            <RequestList
              requests={approved}
              emptyLabel="Aucune demande approuvée."
              onApprove={(id) => approveMutation.mutate(id)}
              onReject={(id) => rejectMutation.mutate(id)}
              busyId={busyId}
            />
          </TabsContent>
          <TabsContent value="rejected" className="mt-4">
            <RequestList
              requests={rejected}
              emptyLabel="Aucune demande rejetée."
              onApprove={(id) => approveMutation.mutate(id)}
              onReject={(id) => rejectMutation.mutate(id)}
              busyId={busyId}
            />
          </TabsContent>
          <TabsContent value="all" className="mt-4">
            <RequestList
              requests={requests}
              emptyLabel="Aucune demande."
              onApprove={(id) => approveMutation.mutate(id)}
              onReject={(id) => rejectMutation.mutate(id)}
              busyId={busyId}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
