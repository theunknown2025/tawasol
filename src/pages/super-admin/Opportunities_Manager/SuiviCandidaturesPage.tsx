import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  fetchApplicationsForOpportunity,
  fetchGestionFormById,
  fetchMyOpportunities,
  updateApplicationDecision,
} from "@/lib/opportunitiesApi";
import {
  APPLICATION_DECISION_LABELS,
  type ApplicationDecision,
  type OpportunityApplication,
} from "@/types/opportunity";
import ExcelExportDialog from "./components/ExcelExportDialog";
import ApplicationFileLink from "./components/ApplicationFileLink";

export default function SuiviCandidaturesPage() {
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>("");
  const [exportOpen, setExportOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: opportunities = [] } = useQuery({
    queryKey: ["opportunities", "admin"],
    queryFn: fetchMyOpportunities,
  });

  const selectedOpportunity = opportunities.find((o) => o.id === selectedOpportunityId);

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ["opportunity-applications", selectedOpportunityId],
    queryFn: () => fetchApplicationsForOpportunity(selectedOpportunityId),
    enabled: !!selectedOpportunityId,
  });

  const { data: form } = useQuery({
    queryKey: ["gestion-form", selectedOpportunity?.registrationFormId],
    queryFn: () =>
      selectedOpportunity?.registrationFormId
        ? fetchGestionFormById(selectedOpportunity.registrationFormId)
        : Promise.resolve(null),
    enabled: !!selectedOpportunity?.registrationFormId,
  });

  const decisionMutation = useMutation({
    mutationFn: ({ appId, decision }: { appId: string; decision: ApplicationDecision }) =>
      updateApplicationDecision(appId, decision),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["opportunity-applications", selectedOpportunityId],
      });
      toast.success("Décision enregistrée");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });

  const renderApplication = (app: OpportunityApplication) => (
    <AccordionItem key={app.id} value={app.id}>
      <AccordionTrigger className="text-left hover:no-underline">
        <div className="flex flex-1 flex-wrap items-center gap-2 pr-4">
          <span className="font-medium">{app.applicantName || "Sans nom"}</span>
          <span className="text-xs text-muted-foreground">{app.applicantEmail}</span>
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs">
            {APPLICATION_DECISION_LABELS[app.decision]}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pb-4">
        <p className="text-xs text-muted-foreground">
          Candidature du {new Date(app.createdAt).toLocaleString("fr-FR")}
        </p>
        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
          {(form?.fields ?? []).map((field) => {
            const answer = app.answers[field.id];
            const file = app.fileUploads[field.id];
            return (
              <div key={field.id}>
                <p className="text-xs font-semibold text-muted-foreground">{field.label}</p>
                <p className="text-sm">
                  {file ? (
                    <ApplicationFileLink path={file.path} fileName={file.fileName} />
                  ) : (
                    answer || "—"
                  )}
                </p>
              </div>
            );
          })}
          {(!form?.fields || form.fields.length === 0) && (
            <p className="text-sm text-muted-foreground">Aucun champ de formulaire associé.</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Décision</Label>
          <Select
            value={app.decision}
            onValueChange={(v) =>
              decisionMutation.mutate({ appId: app.id, decision: v as ApplicationDecision })
            }
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="accepte">Accepté</SelectItem>
              <SelectItem value="sous_reserve">Sous réserve</SelectItem>
              <SelectItem value="rejete">Rejeté</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Suivi Candidatures</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sélectionnez une opportunité pour examiner les candidatures.
          </p>
        </div>
        {selectedOpportunity && applications.length > 0 && (
          <Button type="button" variant="outline" onClick={() => setExportOpen(true)}>
            <FileSpreadsheet size={16} className="mr-2" />
            Exporter Excel
          </Button>
        )}
      </div>

      <div className="mb-6 max-w-md space-y-2">
        <Label>Opportunité</Label>
        <Select value={selectedOpportunityId} onValueChange={setSelectedOpportunityId}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir une opportunité" />
          </SelectTrigger>
          <SelectContent>
            {opportunities.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.title} ({o.status === "published" ? "publié" : "brouillon"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedOpportunityId ? (
        <p className="text-sm text-muted-foreground">Sélectionnez une opportunité pour afficher les candidatures.</p>
      ) : appsLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : applications.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune candidature pour cette opportunité.</p>
      ) : (
        <Accordion type="multiple" className="rounded-2xl border border-border bg-card px-4 shadow-sm">
          {applications.map(renderApplication)}
        </Accordion>
      )}

      {selectedOpportunity && (
        <ExcelExportDialog
          open={exportOpen}
          onOpenChange={setExportOpen}
          opportunity={selectedOpportunity}
          applications={applications}
          formFields={form?.fields ?? []}
        />
      )}
    </div>
  );
}
