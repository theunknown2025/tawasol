import { useEffect, useState } from "react";
import { FolderPlus, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLibraryGroup } from "./createLibraryGroup";

const GROUPS_QUERY_KEY = ["lp-library-groups"] as const;

type CreateGroupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (groupId: string) => void;
};

export function CreateGroupDialog({ open, onOpenChange, onCreated }: CreateGroupDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  const createMutation = useMutation({
    mutationFn: createLibraryGroup,
    onSuccess: (group) => {
      toast.success("Groupe créé");
      void queryClient.invalidateQueries({ queryKey: [...GROUPS_QUERY_KEY] });
      onCreated?.(group.id);
      onOpenChange(false);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Impossible de créer le groupe");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Le nom du groupe est obligatoire");
      return;
    }
    createMutation.mutate({ name: trimmed });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-primary" aria-hidden />
            Nouveau groupe
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="cg-name">Nom du groupe</Label>
            <Input
              id="cg-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. Rapports annuels"
              autoFocus
              required
            />
            <p className="text-xs text-muted-foreground">
              Le groupe apparaîtra comme onglet dans la bibliothèque pour organiser les documents.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="gap-2">
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Création…
                </>
              ) : (
                <>
                  <FolderPlus className="h-4 w-4" aria-hidden />
                  Créer le groupe
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
