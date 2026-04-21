import { useEffect, useState, type ChangeEvent } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { GestionForm, GestionFormField, GestionFormFieldType, GestionFormInput } from "@/types/gestionForm";
import FormPreviewPanel from "./FormPreviewPanel";

type NouvelleFormulaireTabProps = {
  editingForm: GestionForm | null;
  onCancelEdit: () => void;
  onSave: (formId: string | null, payload: GestionFormInput) => Promise<void>;
  onBannerUpload: (file: File) => Promise<string>;
  isSubmitting: boolean;
  isUploadingBanner: boolean;
};

const createField = (): GestionFormField => ({
  id: crypto.randomUUID(),
  label: "",
  type: "text",
  placeholder: "",
  required: false,
  options: [],
});

const fieldTypeLabels: Record<GestionFormFieldType, string> = {
  text: "Texte",
  textarea: "Paragraphe",
  email: "Email",
  number: "Nombre",
  date: "Date",
  select: "Liste deroulante",
  checkbox: "Case a cocher",
};

export default function NouvelleFormulaireTab({
  editingForm,
  onCancelEdit,
  onSave,
  onBannerUpload,
  isSubmitting,
  isUploadingBanner,
}: NouvelleFormulaireTabProps) {
  const [title, setTitle] = useState(editingForm?.title ?? "");
  const [description, setDescription] = useState(editingForm?.description ?? "");
  const [banner, setBanner] = useState(editingForm?.banner ?? "");
  const [formDescription, setFormDescription] = useState(editingForm?.formDescription ?? "");
  const [submitMessageEnabled, setSubmitMessageEnabled] = useState(editingForm?.submitMessageEnabled ?? false);
  const [submitMessage, setSubmitMessage] = useState(editingForm?.submitMessage ?? "");
  const [fields, setFields] = useState<GestionFormField[]>(editingForm?.fields ?? []);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setTitle(editingForm?.title ?? "");
    setDescription(editingForm?.description ?? "");
    setBanner(editingForm?.banner ?? "");
    setFormDescription(editingForm?.formDescription ?? "");
    setSubmitMessageEnabled(editingForm?.submitMessageEnabled ?? false);
    setSubmitMessage(editingForm?.submitMessage ?? "");
    setFields(editingForm?.fields ?? []);
  }, [editingForm]);

  const moveField = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    const [current] = next.splice(index, 1);
    next.splice(target, 0, current);
    setFields(next);
  };

  const updateField = (fieldId: string, patch: Partial<GestionFormField>) => {
    setFields((prev) => prev.map((field) => (field.id === fieldId ? { ...field, ...patch } : field)));
  };

  const removeField = (fieldId: string) => {
    setFields((prev) => prev.filter((field) => field.id !== fieldId));
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!title.trim()) {
      toast.error("Le titre du formulaire est obligatoire");
      return;
    }
    const invalidField = fields.find((field) => !field.label.trim());
    if (invalidField) {
      toast.error("Chaque champ doit avoir un libelle");
      return;
    }

    await onSave(editingForm?.id ?? null, {
      title: title.trim(),
      description: description.trim(),
      banner: banner.trim(),
      formDescription: formDescription.trim(),
      fields: fields.map((field) => ({
        ...field,
        label: field.label.trim(),
        placeholder: field.placeholder?.trim() ?? "",
        options:
          field.type === "select"
            ? (field.options ?? []).map((option) => option.trim()).filter(Boolean)
            : [],
      })),
      submitMessageEnabled,
      submitMessage: submitMessage.trim(),
      status,
    });
  };

  const handleBannerFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const publicUrl = await onBannerUpload(file);
      setBanner(publicUrl);
      toast.success("Banniere telechargee");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur upload banniere");
    } finally {
      event.target.value = "";
    }
  };

  const previewData = {
    title,
    description,
    banner,
    formDescription,
    fields,
    submitMessageEnabled,
    submitMessage,
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Form Builder</h2>
            <Button variant="outline" onClick={() => setPreviewOpen(true)}>
              Apercu pleine page
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Titre du formulaire *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Formulaire d'inscription" />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description courte du formulaire" />
          </div>

          <div className="space-y-2">
            <Label>Banniere (URL)</Label>
            <Input value={banner} onChange={(e) => setBanner(e.target.value)} placeholder="https://..." />
            <div className="flex items-center gap-2">
              <Input type="file" accept="image/*" onChange={handleBannerFile} disabled={isUploadingBanner} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description detaillee</Label>
            <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="min-h-[90px]" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Elements du formulaire</Label>
              <Button variant="outline" size="sm" onClick={() => setFields((prev) => [...prev, createField()])}>
                <Plus size={14} className="mr-1" />
                Ajouter un champ
              </Button>
            </div>

            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ajoutez des champs pour construire votre formulaire.</p>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border border-border p-3 space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label>Libelle</Label>
                        <Input value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label>Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value: GestionFormFieldType) => updateField(field.id, { type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(fieldTypeLabels) as GestionFormFieldType[]).map((type) => (
                              <SelectItem key={type} value={type}>
                                {fieldTypeLabels[type]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label>Placeholder</Label>
                      <Input value={field.placeholder ?? ""} onChange={(e) => updateField(field.id, { placeholder: e.target.value })} />
                    </div>

                    {field.type === "select" && (
                      <div className="space-y-1">
                        <Label>Options (separees par des virgules)</Label>
                        <Input
                          value={(field.options ?? []).join(", ")}
                          onChange={(e) =>
                            updateField(field.id, {
                              options: e.target.value.split(",").map((option) => option.trim()),
                            })
                          }
                          placeholder="Option 1, Option 2, Option 3"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={field.required}
                          onCheckedChange={(checked) => updateField(field.id, { required: checked === true })}
                          id={`required-${field.id}`}
                        />
                        <Label htmlFor={`required-${field.id}`}>Champ obligatoire</Label>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => moveField(index, "up")} disabled={index === 0}>
                          <ArrowUp size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveField(index, "down")}
                          disabled={index === fields.length - 1}
                        >
                          <ArrowDown size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeField(field.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Tabs defaultValue="message" className="w-full">
            <TabsList>
              <TabsTrigger value="message">Message de soumission</TabsTrigger>
            </TabsList>
            <TabsContent value="message" className="space-y-3 pt-2">
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Activer le message final</p>
                  <p className="text-xs text-muted-foreground">
                    Affiche un message apres la soumission du formulaire.
                  </p>
                </div>
                <Switch checked={submitMessageEnabled} onCheckedChange={setSubmitMessageEnabled} />
              </div>
              {submitMessageEnabled && (
                <Textarea
                  value={submitMessage}
                  onChange={(e) => setSubmitMessage(e.target.value)}
                  className="min-h-[80px]"
                  placeholder="Merci pour votre soumission..."
                />
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            {editingForm && (
              <Button variant="outline" onClick={onCancelEdit} disabled={isSubmitting}>
                Annuler l'edition
              </Button>
            )}
            <Button variant="outline" onClick={() => void handleSave("draft")} disabled={isSubmitting}>
              Enregistrer brouillon
            </Button>
            <Button onClick={() => void handleSave("published")} disabled={isSubmitting}>
              Publier
            </Button>
          </div>
        </div>

        <FormPreviewPanel form={previewData} />
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apercu pleine page du formulaire</DialogTitle>
          </DialogHeader>
          <FormPreviewPanel form={previewData} />
        </DialogContent>
      </Dialog>
    </>
  );
}
