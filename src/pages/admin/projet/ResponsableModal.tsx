import * as React from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePersonnel } from "@/hooks/usePersonnel";

interface ResponsableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (personnelId: string | null, personnelName: string) => void;
}

export function ResponsableModal({ open, onOpenChange, onSelect }: ResponsableModalProps) {
  const { personnel } = usePersonnel();
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!search.trim()) return personnel;
    const q = search.toLowerCase();
    return personnel.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.position?.toLowerCase().includes(q) ?? false)
    );
  }, [personnel, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choisir le responsable</DialogTitle>
          <DialogDescription className="sr-only">
            Sélectionner un membre du personnel comme responsable du projet
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-64 overflow-auto space-y-1 border rounded-md p-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                onSelect(null, "");
                onOpenChange(false);
              }}
            >
              Aucun
            </Button>
            {filtered.map((p) => (
              <Button
                key={p.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  onSelect(p.id, p.full_name);
                  onOpenChange(false);
                }}
              >
                <span className="font-medium">{p.full_name}</span>
                {p.position && (
                  <span className="text-muted-foreground ml-2">— {p.position}</span>
                )}
              </Button>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun personnel trouvé.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
