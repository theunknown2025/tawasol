import type { GestionForm, GestionFormField } from "@/types/gestionForm";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type FormPreviewPanelProps = {
  form: Pick<GestionForm, "title" | "description" | "banner" | "formDescription" | "fields" | "submitMessageEnabled" | "submitMessage">;
};

const renderField = (field: GestionFormField) => {
  switch (field.type) {
    case "textarea":
      return <Textarea placeholder={field.placeholder || "Votre reponse"} className="min-h-[90px]" />;
    case "checkbox":
      return (
        <div className="flex items-center gap-2 rounded-md border border-border p-3">
          <Checkbox id={`preview-${field.id}`} />
          <Label htmlFor={`preview-${field.id}`}>{field.placeholder || "Je confirme"}</Label>
        </div>
      );
    case "select":
      return (
        <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">{field.placeholder || "Selectionnez une option"}</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    default:
      return <Input type={field.type} placeholder={field.placeholder || "Votre reponse"} />;
  }
};

export default function FormPreviewPanel({ form }: FormPreviewPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div
        className="h-40 bg-gradient-to-r from-primary/70 to-primary/20 flex items-end p-4 text-white"
        style={
          form.banner
            ? {
                backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.2)), url(${form.banner})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }
            : undefined
        }
      >
        <div>
          <h3 className="text-xl font-semibold">{form.title || "Titre du formulaire"}</h3>
          <p className="text-sm text-white/90">{form.description || "Description courte du formulaire"}</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {form.formDescription && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{form.formDescription}</p>
        )}

        {form.fields.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Aucun element ajoute. Ajoutez des champs dans le Form Builder.
          </p>
        ) : (
          form.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label className="text-sm font-medium">
                {field.label || "Champ sans titre"} {field.required && <span className="text-destructive">*</span>}
              </Label>
              {renderField(field)}
            </div>
          ))
        )}

        {form.submitMessageEnabled && form.submitMessage && (
          <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-3 text-sm text-primary">
            Message final: {form.submitMessage}
          </div>
        )}
      </div>
    </div>
  );
}
