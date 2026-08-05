import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createLpProjet, updateLpProjet } from "@/lib/lpProjetsApi";
import {
  createEmptyLpProjetInput,
  type LpProjet,
  type LpProjetInput,
} from "@/types/lpProjet";
import { ProjetForm } from "./ProjetForm";

const QUERY_KEY = ["lp-projets"] as const;

type NewProjetPanelProps = {
  onCreated?: () => void;
};

export function NewProjetPanel({ onCreated }: NewProjetPanelProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<LpProjetInput>(createEmptyLpProjetInput);

  const createMutation = useMutation({
    mutationFn: createLpProjet,
    onSuccess: () => {
      toast.success("Projet créé");
      setForm(createEmptyLpProjetInput());
      void queryClient.invalidateQueries({ queryKey: [...QUERY_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["lp-projets-landing-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["lp-projets", "published"] });
      onCreated?.();
    },
    onError: (e: Error) => {
      toast.error(e.message || "Impossible de créer le projet");
    },
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Nouveau projet</h2>
      <ProjetForm
        value={form}
        onChange={setForm}
        onSubmit={() => createMutation.mutate(form)}
        submitLabel="Enregistrer le projet"
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}

type EditProjetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projet: LpProjet | null;
};

export function EditProjetDialog({ open, onOpenChange, projet }: EditProjetDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<LpProjetInput>(createEmptyLpProjetInput);

  useEffect(() => {
    if (!projet || !open) return;
    setForm({
      title: projet.title,
      banner: projet.banner,
      dateDebut: projet.dateDebut,
      dateFin: projet.dateFin,
      description: projet.description,
      results: projet.results,
      zones: projet.zones,
      partners: projet.partners,
      status: projet.status,
    });
  }, [projet, open]);

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!projet) throw new Error("Projet introuvable");
      return updateLpProjet(projet.id, form);
    },
    onSuccess: () => {
      toast.success("Projet mis à jour");
      void queryClient.invalidateQueries({ queryKey: [...QUERY_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["lp-projets-landing-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["lp-projets", "published"] });
      onOpenChange(false);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Impossible d’enregistrer les modifications");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le projet</DialogTitle>
        </DialogHeader>
        <ProjetForm
          value={form}
          onChange={setForm}
          onSubmit={() => updateMutation.mutate()}
          submitLabel="Enregistrer les modifications"
          isSubmitting={updateMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
