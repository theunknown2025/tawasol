import { useEffect, useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  approveCartographieInfoRequest,
  fetchCartographieInfoRequests,
  rejectCartographieInfoRequest,
} from "./cartographieInfoRequestApi";
import { CartographieRequestFiltersFields } from "./CartographieRequestFiltersFields";
import {
  CARTOGRAPHIE_INFO_FIELD_OPTIONS,
  CARTOGRAPHIE_INFO_STATUS_LABELS,
  labelForInfoField,
  type CartographieInfoFieldKey,
  type CartographieInfoRequest,
  type CartographieInfoRequestFilters,
  type CartographieInfoRequestStatus,
} from "./cartographieInfoRequestTypes";

function statusBadgeVariant(
  status: CartographieInfoRequestStatus,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "approved") return "default";
  if (status === "rejected") return "destructive";
  return "secondary";
}

function listOrDash(items: string[]): string {
  return items.length > 0 ? items.join(", ") : "—";
}

function RequestRow({
  request,
  onApprove,
  onReject,
  busyId,
}: {
  request: CartographieInfoRequest;
  onApprove: (payload: {
    requestId: string;
    requestedFields: CartographieInfoFieldKey[];
    filters: CartographieInfoRequestFilters;
    adminComment: string;
  }) => void;
  onReject: (id: string) => void;
  busyId: string | null;
}) {
  const busy = busyId === request.id;
  const isPending = request.status === "pending";

  const [requestedFields, setRequestedFields] = useState<CartographieInfoFieldKey[]>(
    request.requestedFields,
  );
  const [filters, setFilters] = useState<CartographieInfoRequestFilters>({
    activities: request.filterActivities,
    provinces: request.filterProvinces,
    communes: request.filterCommunes,
  });
  const [adminComment, setAdminComment] = useState(request.adminComment ?? "");

  useEffect(() => {
    setRequestedFields(request.requestedFields);
    setFilters({
      activities: request.filterActivities,
      provinces: request.filterProvinces,
      communes: request.filterCommunes,
    });
    setAdminComment(request.adminComment ?? "");
  }, [request]);

  const toggleField = (key: CartographieInfoFieldKey, checked: boolean) => {
    setRequestedFields((prev) => {
      if (checked) return prev.includes(key) ? prev : [...prev, key];
      return prev.filter((k) => k !== key);
    });
  };

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

        <Accordion type="multiple" defaultValue={["filters", "elements"]} className="rounded-lg border border-border">
          <AccordionItem value="filters" className="px-3">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline">
              Filtres
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              {isPending ? (
                <CartographieRequestFiltersFields
                  idPrefix={`admin-${request.id}`}
                  value={filters}
                  onChange={setFilters}
                  disabled={busy}
                />
              ) : (
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Activité</p>
                    <p>{listOrDash(request.filterActivities)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Province</p>
                    <p>{listOrDash(request.filterProvinces)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Commune</p>
                    <p>{listOrDash(request.filterCommunes)}</p>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="elements" className="border-b-0 px-3">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline">
              Éléments d&apos;information
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              {isPending ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {CARTOGRAPHIE_INFO_FIELD_OPTIONS.map((opt) => {
                    const checked = requestedFields.includes(opt.key);
                    const id = `admin-field-${request.id}-${opt.key}`;
                    return (
                      <label
                        key={opt.key}
                        htmlFor={id}
                        className="flex cursor-pointer items-start gap-2 rounded-md border border-border/80 px-3 py-2 text-sm hover:bg-muted/40"
                      >
                        <Checkbox
                          id={id}
                          checked={checked}
                          disabled={busy}
                          onCheckedChange={(v) => toggleField(opt.key, v === true)}
                          className="mt-0.5"
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <ul className="list-inside list-disc text-sm">
                  {request.requestedFields.map((key) => (
                    <li key={key}>{labelForInfoField(key)}</li>
                  ))}
                </ul>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {isPending ? (
          <div className="space-y-2">
            <Label htmlFor={`admin-comment-${request.id}`}>Commentaire (inclus dans l&apos;e-mail)</Label>
            <Textarea
              id={`admin-comment-${request.id}`}
              rows={3}
              disabled={busy}
              placeholder="Ajoutez un commentaire pour le demandeur…"
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
            />
          </div>
        ) : request.adminComment ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <p className="text-xs font-semibold text-muted-foreground">Commentaire envoyé</p>
            <p className="mt-1 whitespace-pre-wrap">{request.adminComment}</p>
          </div>
        ) : null}

        {isPending ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={busy}
              onClick={() =>
                onApprove({
                  requestId: request.id,
                  requestedFields,
                  filters,
                  adminComment,
                })
              }
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
  onApprove: (payload: {
    requestId: string;
    requestedFields: CartographieInfoFieldKey[];
    filters: CartographieInfoRequestFilters;
    adminComment: string;
  }) => void;
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
    onMutate: (input) => setBusyId(input.requestId),
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

  const handleApprove = (payload: {
    requestId: string;
    requestedFields: CartographieInfoFieldKey[];
    filters: CartographieInfoRequestFilters;
    adminComment: string;
  }) => {
    if (payload.requestedFields.length === 0) {
      toast.error("Sélectionnez au moins un élément d'information.");
      return;
    }
    approveMutation.mutate({
      requestId: payload.requestId,
      requestedFields: payload.requestedFields,
      filterActivities: payload.filters.activities,
      filterProvinces: payload.filters.provinces,
      filterCommunes: payload.filters.communes,
      adminComment: payload.adminComment,
    });
  };

  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Demandes d&apos;information</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Revoyez les filtres et éléments demandés, ajoutez un commentaire, puis approuvez pour
          envoyer l&apos;Excel filtré au demandeur.
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
              onApprove={handleApprove}
              onReject={(id) => rejectMutation.mutate(id)}
              busyId={busyId}
            />
          </TabsContent>
          <TabsContent value="approved" className="mt-4">
            <RequestList
              requests={approved}
              emptyLabel="Aucune demande approuvée."
              onApprove={handleApprove}
              onReject={(id) => rejectMutation.mutate(id)}
              busyId={busyId}
            />
          </TabsContent>
          <TabsContent value="rejected" className="mt-4">
            <RequestList
              requests={rejected}
              emptyLabel="Aucune demande rejetée."
              onApprove={handleApprove}
              onReject={(id) => rejectMutation.mutate(id)}
              busyId={busyId}
            />
          </TabsContent>
          <TabsContent value="all" className="mt-4">
            <RequestList
              requests={requests}
              emptyLabel="Aucune demande."
              onApprove={handleApprove}
              onReject={(id) => rejectMutation.mutate(id)}
              busyId={busyId}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
