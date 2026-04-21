import { useState, useMemo } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useEvenements, type Evenement } from "@/hooks/useEvenements";
import { useGestionForms } from "@/hooks/useGestionForms";
import {
  useMySubscriptions,
  useSubscriptionsForMyEvents,
} from "@/hooks/useEventSubscriptions";
import { useEventFormRegistrationsForMyEvents } from "@/hooks/useEventFormRegistrations";
import { toast } from "sonner";

import { EventPreview } from "./EventPreview";
import { AllEvents } from "./AllEvents";
import { MyEvents } from "./MyEvents";
import { NouveauEvent } from "./NouveauEvent";
import { MesInscriptions } from "./MesInscriptions";

export default function EvenementsPage() {
  const { evenements: allEvents, isLoading: loadingAll } = useEvenements("all");
  const { evenements: myEvents, isLoading: loadingMine } = useEvenements("mine");
  const {
    addEvenement,
    updateEvenement,
    deleteEvenement,
    isCreating,
    isUpdating,
  } = useEvenements("all");
  const { subscribe } = useMySubscriptions();
  const {
    subscriptionsByEvent,
    approve,
    reject,
    isLoading: loadingSubs,
    isApproving,
    isRejecting,
  } = useSubscriptionsForMyEvents();
  const {
    subscriptions: mySubscriptions,
    deleteSubscription,
    isLoading: loadingMySubs,
    isDeleting,
  } = useMySubscriptions();
  const { forms } = useGestionForms();
  const {
    registrationsByEvent,
    updateStatus: updateRegistrationStatus,
    isLoading: loadingRegistrations,
    isUpdating: isUpdatingRegistrations,
  } = useEventFormRegistrationsForMyEvents();

  const [tab, setTab] = useState("tous");
  const [viewEvt, setViewEvt] = useState<Evenement | null>(null);

  const publishedEvents = useMemo(
    () => allEvents.filter((e) => e.status === "published"),
    [allEvents],
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteEvenement(id);
      setViewEvt(null);
      toast.success("Événement supprimé");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await updateEvenement(id, { status: "published" });
      setViewEvt((prev) => (prev?.id === id ? { ...prev, status: "published" } : prev));
      toast.success("Événement publié");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await updateEvenement(id, { status: "draft" });
      setViewEvt((prev) => (prev?.id === id ? { ...prev, status: "draft" } : prev));
      toast.success("Événement retiré de la publication");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleSubscribe = async (evt: Evenement) => {
    try {
      await subscribe(evt.id);
      toast.success(`Inscription à « ${evt.titre} » enregistrée`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      if (msg.includes("duplicate") || msg.includes("unique"))
        toast.error("Vous êtes déjà inscrit à cet événement");
      else toast.error(msg);
    }
  };

  const handleSubmit = async (data: {
    titre: string;
    description: string;
    banner?: File | null;
    duree: string;
    deadlineInscription: string | null;
    liens: string[];
    files: { file: File; name: string; type: string }[];
    registrationFormId: string | null;
  }) => {
    await addEvenement({
      titre: data.titre,
      description: data.description,
      status: "published",
      banner: data.banner,
      duree: data.duree || undefined,
      deadlineInscription: data.deadlineInscription,
      liens: data.liens,
      files: data.files,
      registrationFormId: data.registrationFormId,
    });
    toast.success("Événement créé");
  };

  if (viewEvt) {
    return (
      <EventPreview
        event={viewEvt}
        onBack={() => setViewEvt(null)}
        onSubscribe={handleSubscribe}
      />
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-primary/10">
          <CalendarDays className="text-primary" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Événements</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="tous">
            Tous les événements
            <Badge variant="secondary" className="ml-2 text-xs">
              {publishedEvents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="mine">
            Mes événements
            <Badge variant="secondary" className="ml-2 text-xs">
              {myEvents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="inscriptions">
            Mes inscriptions
            <Badge variant="secondary" className="ml-2 text-xs">
              {mySubscriptions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="nouveau">
            <Plus size={14} className="mr-1" />
            Nouveau événement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tous" className="mt-0">
          <AllEvents
            events={publishedEvents}
            isLoading={loadingAll}
            onView={setViewEvt}
            onSubscribe={handleSubscribe}
          />
        </TabsContent>

        <TabsContent value="mine" className="mt-0">
          <MyEvents
            events={myEvents}
            isLoading={loadingMine || loadingSubs || loadingRegistrations}
            subscriptionsByEvent={subscriptionsByEvent}
            registrationsByEvent={registrationsByEvent}
            onView={setViewEvt}
            onDelete={handleDelete}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
            onApprove={async (id) => {
              try {
                await approve(id);
                toast.success("Inscription approuvée");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Erreur");
              }
            }}
            onReject={async (id) => {
              try {
                await reject(id);
                toast.success("Inscription rejetée");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Erreur");
              }
            }}
            onApproveRegistration={async (id) => {
              try {
                await updateRegistrationStatus(id, "approved");
                toast.success("Inscription acceptee");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Erreur");
              }
            }}
            onRejectRegistration={async (id) => {
              try {
                await updateRegistrationStatus(id, "rejected");
                toast.success("Inscription rejetee");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Erreur");
              }
            }}
            isUpdating={isUpdating}
            isApproving={isApproving}
            isRejecting={isRejecting}
            isUpdatingRegistrations={isUpdatingRegistrations}
          />
        </TabsContent>

        <TabsContent value="inscriptions" className="mt-0">
          <MesInscriptions
            subscriptions={mySubscriptions}
            isLoading={loadingMySubs}
            onViewEvent={setViewEvt}
            onDeleteSubscription={async (id) => {
              try {
                await deleteSubscription(id);
                toast.success("Inscription annulée");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Erreur");
              }
            }}
            isDeleting={isDeleting}
          />
        </TabsContent>

        <TabsContent value="nouveau" className="mt-0">
          <NouveauEvent
            forms={forms.map((f) => ({ id: f.id, title: f.title }))}
            onSubmit={handleSubmit}
            onCreateSuccess={() => setTab("tous")}
            isCreating={isCreating}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
