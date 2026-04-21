import { useState } from "react";
import { ClipboardPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useGestionForms } from "@/hooks/useGestionForms";
import type { GestionForm, GestionFormInput } from "@/types/gestionForm";
import NouvelleFormulaireTab from "./components/NouvelleFormulaireTab";
import ListeFormulaireTab from "./components/ListeFormulaireTab";

export default function GestionFormPage() {
  const [tab, setTab] = useState("nouvelle");
  const [editingForm, setEditingForm] = useState<GestionForm | null>(null);
  const {
    forms,
    createForm,
    updateForm,
    deleteForm,
    setPublishStatus,
    uploadBanner,
    isSaving,
    isUploadingBanner,
  } = useGestionForms();

  const handleSave = async (formId: string | null, payload: GestionFormInput) => {
    try {
      if (formId) {
        await updateForm(formId, payload);
        toast.success(
          payload.status === "published" ? "Formulaire mis a jour et publie" : "Formulaire mis a jour"
        );
      } else {
        await createForm(payload);
        toast.success(payload.status === "published" ? "Formulaire publie" : "Brouillon enregistre");
      }
      setEditingForm(null);
      setTab("liste");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (form: GestionForm) => {
    setEditingForm(form);
    setTab("nouvelle");
  };

  const handleDelete = (form: GestionForm) => {
    void deleteForm(form.id)
      .then(() => {
        toast.success(`Formulaire "${form.title}" supprime`);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
      });
  };

  const handlePublishToggle = (form: GestionForm) => {
    const nextStatus = form.status === "published" ? "draft" : "published";
    void setPublishStatus(form.id, nextStatus)
      .then(() => {
        toast.success(nextStatus === "published" ? "Formulaire publie" : "Formulaire depublie");
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Erreur lors du changement de statut");
      });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <ClipboardPlus className="text-primary" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion Form</h1>
          <p className="text-sm text-muted-foreground">
            Creez des formulaires dynamiques, previsualisez-les et publiez-les.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-2">
          <TabsTrigger value="nouvelle">Nouvelle formulaire</TabsTrigger>
          <TabsTrigger value="liste">
            Liste formulaire
            {forms.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {forms.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nouvelle">
          <NouvelleFormulaireTab
            editingForm={editingForm}
            onCancelEdit={() => setEditingForm(null)}
            onSave={handleSave}
            onBannerUpload={uploadBanner}
            isSubmitting={isSaving}
            isUploadingBanner={isUploadingBanner}
          />
        </TabsContent>

        <TabsContent value="liste">
          <ListeFormulaireTab
            forms={forms}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPublishToggle={handlePublishToggle}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
