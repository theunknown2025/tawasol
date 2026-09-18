import * as React from "react";
import { Search, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePersonnel } from "@/hooks/usePersonnel";
import { cn } from "@/lib/utils";

interface ResponsableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Single-select (responsable). Ignored when `multiple` is true. */
  onSelect: (personnelId: string | null, personnelName: string) => void;
  /** Multi-select (contributeurs). */
  multiple?: boolean;
  selectedIds?: string[];
  onSelectMultiple?: (items: { id: string; name: string }[]) => void;
  /** Personnel ids to hide from the list (e.g. the responsable). */
  excludeIds?: string[];
  title?: string;
  description?: string;
}

export function ResponsableModal({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  selectedIds = [],
  onSelectMultiple,
  excludeIds = [],
  title,
  description,
}: ResponsableModalProps) {
  const { personnel } = usePersonnel();
  const [search, setSearch] = React.useState("");
  const [draftIds, setDraftIds] = React.useState<string[]>(selectedIds);

  React.useEffect(() => {
    if (open) {
      setSearch("");
      setDraftIds(selectedIds);
    }
  }, [open, selectedIds]);

  const excludeSet = React.useMemo(() => new Set(excludeIds.filter(Boolean)), [excludeIds]);

  const available = React.useMemo(
    () => personnel.filter((p) => !excludeSet.has(p.id)),
    [personnel, excludeSet]
  );

  const filtered = React.useMemo(() => {
    if (!search.trim()) return available;
    const q = search.toLowerCase();
    return available.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.position?.toLowerCase().includes(q) ?? false)
    );
  }, [available, search]);

  const toggleId = (id: string) => {
    setDraftIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const confirmMultiple = () => {
    const items = draftIds
      .map((id) => {
        const p = personnel.find((x) => x.id === id);
        return p ? { id: p.id, name: p.full_name } : null;
      })
      .filter((x): x is { id: string; name: string } => Boolean(x));
    onSelectMultiple?.(items);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {title ?? (multiple ? "Choisir les contributeurs" : "Choisir le responsable")}
          </DialogTitle>
          <DialogDescription className={description ? undefined : "sr-only"}>
            {description ??
              (multiple
                ? "Sélectionner un ou plusieurs contributeurs (hors responsable)"
                : "Sélectionner un membre du personnel comme responsable")}
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
            {!multiple && (
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
            )}
            {filtered.map((p) => {
              const selected = multiple && draftIds.includes(p.id);
              return (
                <Button
                  key={p.id}
                  variant="ghost"
                  className={cn("w-full justify-start", selected && "bg-muted")}
                  onClick={() => {
                    if (multiple) {
                      toggleId(p.id);
                    } else {
                      onSelect(p.id, p.full_name);
                      onOpenChange(false);
                    }
                  }}
                >
                  {multiple && (
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        selected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  )}
                  <span className="font-medium">{p.full_name}</span>
                  {p.position && (
                    <span className="text-muted-foreground ml-2">— {p.position}</span>
                  )}
                </Button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {excludeSet.size > 0 && available.length === 0
                  ? "Aucun autre personnel disponible."
                  : "Aucun personnel trouvé."}
              </p>
            )}
          </div>
        </div>
        {multiple && (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={confirmMultiple}>
              Valider ({draftIds.length})
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
