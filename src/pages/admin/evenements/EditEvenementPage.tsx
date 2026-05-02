import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchEvenementById } from "@/lib/eventsApi";
import { useEvenements } from "@/hooks/useEvenements";
import { useGestionForms } from "@/hooks/useGestionForms";
import { toast } from "sonner";
import { EvenementEditorForm } from "./EvenementEditorForm";

export default function EditEvenementPage() {
  const { id = "" } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { updateEvenement, isUpdating } = useEvenements("all");
  const { forms } = useGestionForms();

  const { data: event, isLoading } = useQuery({
    queryKey: ["evenement", id],
    queryFn: () => fetchEvenementById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">Chargement de l’événement…</div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-sm text-muted-foreground">Événement introuvable ou accès refusé.</p>
        <Button variant="outline" asChild>
          <Link to="/admin/evenements?tab=mine">Retour</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Button variant="ghost" asChild className="mb-6 gap-2">
        <Link to="/admin/evenements?tab=mine">
          <ArrowLeft size={18} />
          Retour à mes événements
        </Link>
      </Button>

      <EvenementEditorForm
        mode="edit"
        forms={forms.map((f) => ({ id: f.id, title: f.title }))}
        initialTitre={event.titre}
        initialDescription={event.description}
        initialEventDateStart={event.eventDateStart}
        initialEventDateEnd={event.eventDateEnd}
        initialDeadlineInscription={event.deadlineInscription}
        initialLiens={event.liens}
        initialRegistrationFormId={event.registrationFormId}
        existingBannerUrl={event.bannerUrl}
        existingFileNames={event.files.map((f) => f.name)}
        submitLabel="Enregistrer les modifications"
        isSubmitting={isUpdating}
        showReset={false}
        onSubmit={async (payload) => {
          await updateEvenement(event.id, {
            titre: payload.titre,
            description: payload.description,
            eventDateStart: payload.eventDateStart,
            eventDateEnd: payload.eventDateEnd,
            deadlineInscription: payload.deadlineInscription,
            liens: payload.liens,
            registrationFormId: payload.registrationFormId,
            banner: payload.banner,
            newFiles: payload.files,
          });
          await queryClient.invalidateQueries({ queryKey: ["evenement", id] });
          toast.success("Événement mis à jour");
        }}
      />
    </div>
  );
}
