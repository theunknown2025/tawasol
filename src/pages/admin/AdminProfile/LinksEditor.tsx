import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface LinkDraft {
  label: string;
  url: string;
  sort_order: number;
}

interface LinksEditorProps {
  links: LinkDraft[];
  onChange: (links: LinkDraft[]) => void;
}

export function LinksEditor({ links, onChange }: LinksEditorProps) {
  const update = (index: number, patch: Partial<LinkDraft>) => {
    onChange(links.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const remove = (index: number) => {
    onChange(links.filter((_, i) => i !== index).map((l, i) => ({ ...l, sort_order: i })));
  };

  const add = () => {
    onChange([...links, { label: "", url: "https://", sort_order: links.length }]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Liens (optionnel)</Label>
        <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1">
          <Plus className="h-4 w-4" />
          Ajouter un lien
        </Button>
      </div>
      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun lien. Utilisez « Ajouter un lien ».</p>
      ) : (
        <ul className="space-y-3">
          {links.map((link, index) => (
            <li
              key={index}
              className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3 sm:flex-row sm:items-end"
            >
              <GripVertical className="hidden h-5 w-5 shrink-0 text-muted-foreground sm:block" aria-hidden />
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Libellé</Label>
                  <Input
                    value={link.label}
                    onChange={(e) => update(index, { label: e.target.value })}
                    placeholder="Site web, LinkedIn…"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">URL</Label>
                  <Input
                    value={link.url}
                    onChange={(e) => update(index, { url: e.target.value })}
                    placeholder="https://"
                    type="url"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => remove(index)}
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
