import * as React from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PersonnelFormData } from "@/types/personnel";

interface PersonnelSaveActionProps {
  data: PersonnelFormData;
  createAuthUser: boolean;
  onSave: (data: PersonnelFormData, createAuthUser: boolean) => Promise<{ error: string | null }>;
  onSuccess: () => void;
  disabled?: boolean;
}

export function PersonnelSaveAction({
  data,
  createAuthUser,
  onSave,
  onSuccess,
  disabled = false,
}: PersonnelSaveActionProps) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSave = async () => {
    if (!data.full_name?.trim() || !data.email?.trim()) {
      setError("Nom complet et email sont requis.");
      return;
    }
    setError(null);
    setSaving(true);
    const { error: saveError } = await onSave(data, createAuthUser);
    setSaving(false);
    if (saveError) {
      setError(saveError);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleSave} disabled={disabled || saving}>
        <Save className="h-4 w-4" />
        {saving ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </div>
  );
}
