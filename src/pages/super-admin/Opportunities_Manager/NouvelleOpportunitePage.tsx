import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useOpportunities } from "@/hooks/useOpportunities";
import type { Opportunity, OpportunityInput } from "@/types/opportunity";
import NouvelleOpportuniteTab from "./components/NouvelleOpportuniteTab";
import ListeOpportunitesTab from "./components/ListeOpportunitesTab";

export default function NouvelleOpportunitePage() {
  const [tab, setTab] = useState("nouvelle");
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const {
    opportunities,
    publishedForms,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    setPublishStatus,
    uploadBanner,
    uploadDocument,
    isSaving,
    isUploadingBanner,
    isUploadingDocument,
  } = useOpportunities();

  const handleSave = async (id: string | null, payload: OpportunityInput) => {
    try {
      if (id) {
        await updateOpportunity(id, payload);
        toast.success(payload.status === "published" ? "Opportunité mise à jour et publiée" : "Opportunité mise à jour");
      } else {
        await createOpportunity(payload);
        toast.success(payload.status === "published" ? "Opportunité publiée" : "Brouillon enregistré");
      }
      setEditingOpportunity(null);
      setTab("liste");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (opp: Opportunity) => {
    setEditingOpportunity(opp);
    setTab("nouvelle");
  };

  const handleDelete = (opp: Opportunity) => {
    void deleteOpportunity(opp.id)
      .then(() => toast.success(`« ${opp.title} » supprimée`))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erreur"));
  };

  const handlePublishToggle = (opp: Opportunity) => {
    const next = opp.status === "published" ? "draft" : "published";
    void setPublishStatus(opp.id, next)
      .then(() =>
        toast.success(next === "published" ? "Opportunité publiée" : "Opportunité dépubliée"),
      )
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erreur"));
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nouvelle Opportunité</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Créez une opportunité ou gérez la liste existante.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="nouvelle">Nouvelle Opportunité</TabsTrigger>
          <TabsTrigger value="liste">Liste Opportunités</TabsTrigger>
        </TabsList>
        <TabsContent value="nouvelle" className="mt-6">
          <NouvelleOpportuniteTab
            editingOpportunity={editingOpportunity}
            publishedForms={publishedForms}
            onCancelEdit={() => setEditingOpportunity(null)}
            onSave={handleSave}
            onBannerUpload={uploadBanner}
            onDocumentUpload={(file, label) => uploadDocument({ file, label })}
            isSubmitting={isSaving}
            isUploadingBanner={isUploadingBanner}
            isUploadingDocument={isUploadingDocument}
          />
        </TabsContent>
        <TabsContent value="liste" className="mt-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <ListeOpportunitesTab
              opportunities={opportunities}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPublishToggle={handlePublishToggle}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
