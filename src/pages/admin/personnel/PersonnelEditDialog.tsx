import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Personnel, PersonnelFormData } from "@/types/personnel";

const POSITIONS = [
  "Chef de projet",
  "Développeur",
  "Designer",
  "Commercial",
  "Support",
  "Autre",
];

interface PersonnelEditDialogProps {
  personnel: Personnel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: Partial<PersonnelFormData>) => Promise<{ error: string | null }>;
  onSaved?: () => void;
}

export function PersonnelEditDialog({
  personnel,
  open,
  onOpenChange,
  onSave,
  onSaved,
}: PersonnelEditDialogProps) {
  const [formData, setFormData] = React.useState<PersonnelFormData>({
    full_name: "",
    phone: "",
    email: "",
    position: "",
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (personnel) {
      setFormData({
        full_name: personnel.full_name,
        phone: personnel.phone ?? "",
        email: personnel.email,
        position: personnel.position ?? "",
      });
      setError(null);
    }
  }, [personnel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personnel) return;
    setError(null);
    setSaving(true);
    const { error: saveError } = await onSave(personnel.id, formData);
    setSaving(false);
    if (saveError) {
      setError(saveError);
    } else {
      onOpenChange(false);
      onSaved?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier le membre</DialogTitle>
          <DialogDescription>Modifiez les champs puis enregistrez.</DialogDescription>
        </DialogHeader>
        {personnel && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">Nom Complet</Label>
                <Input
                  id="edit_full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                  placeholder="Jean Dupont"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Tél</Label>
                <Input
                  id="edit_phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Select
                  value={formData.position || "_"}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, position: v === "_" ? "" : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_">Sélectionner</SelectItem>
                    {POSITIONS.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
