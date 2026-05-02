import { EvenementEditorForm, type EvenementFormSubmitPayload } from "./EvenementEditorForm";

interface NouveauEventProps {
  forms: { id: string; title: string }[];
  onSubmit: (data: EvenementFormSubmitPayload) => Promise<void>;
  onCreateSuccess: () => void;
  isCreating: boolean;
}

export function NouveauEvent({ forms, onSubmit, onCreateSuccess, isCreating }: NouveauEventProps) {
  return (
    <EvenementEditorForm
      mode="create"
      forms={forms}
      onSubmit={async (payload) => {
        await onSubmit(payload);
        onCreateSuccess();
      }}
      submitLabel="Créer l'événement"
      isSubmitting={isCreating}
    />
  );
}
