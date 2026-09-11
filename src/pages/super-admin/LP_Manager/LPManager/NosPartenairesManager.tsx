import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, Handshake, ImagePlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadLandingPageImage } from "@/lib/lpLandingPageApi";
import {
  clampNosPartenairesDescription,
  createDefaultNosPartenaireEntry,
  NOS_PARTENAIRES_DESC_MAX,
  NOS_PARTENAIRES_ENTRIES_MAX,
  type NosPartenaireEntry,
  type NosPartenairesContent,
} from "../types";

type NosPartenairesManagerProps = {
  value: NosPartenairesContent;
  onChange: (next: NosPartenairesContent) => void;
};

export function NosPartenairesManager({ value, onChange }: NosPartenairesManagerProps) {
  const subtitle = value.subtitle ?? "";
  const entries = value.entries ?? [];
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const patchContent = (partial: Partial<NosPartenairesContent>) => {
    onChange({ ...value, ...partial });
  };

  const patchEntries = (next: NosPartenaireEntry[]) => {
    patchContent({ entries: next });
  };

  const patchEntry = (index: number, partial: Partial<NosPartenaireEntry>) => {
    patchEntries(
      entries.map((e, i) => {
        if (i !== index) return e;
        const next = { ...e, ...partial };
        if (typeof partial.description === "string") {
          next.description = clampNosPartenairesDescription(partial.description);
        }
        return next;
      }),
    );
  };

  const addEntry = () => {
    if (entries.length >= NOS_PARTENAIRES_ENTRIES_MAX) {
      toast.error(`Maximum ${NOS_PARTENAIRES_ENTRIES_MAX} partenaires.`);
      return;
    }
    patchEntries([...entries, createDefaultNosPartenaireEntry(entries.length)]);
  };

  const removeEntry = (index: number) => {
    patchEntries(entries.filter((_, i) => i !== index));
  };

  const moveEntry = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= entries.length) return;
    const next = [...entries];
    const t = next[index];
    next[index] = next[to]!;
    next[to] = t!;
    patchEntries(next);
  };

  const handleLogoFile = async (index: number, file: File | undefined) => {
    if (!file) return;
    setUploadingIndex(index);
    try {
      const { url, usedFallback } = await uploadLandingPageImage(file, "nos-partenaires");
      patchEntry(index, { logoUrl: url });
      if (usedFallback) {
        toast.warning("Image enregistrée en local", {
          description:
            "Le stockage distant n’est pas disponible : l’image est intégrée pour cette session.",
        });
      } else {
        toast.success("Logo téléversé");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du téléversement");
    } finally {
      setUploadingIndex(null);
      const id = entries[index]?.id;
      if (id && fileRefs.current[id]) fileRefs.current[id]!.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="nos-partenaires-subtitle">Sous-titre court</Label>
        <Textarea
          id="nos-partenaires-subtitle"
          value={subtitle}
          rows={3}
          onChange={(ev) => patchContent({ subtitle: ev.target.value })}
          placeholder="Introduction courte de la section Nos partenaires…"
          className="min-h-[4.5rem] resize-y"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {entries.length} / {NOS_PARTENAIRES_ENTRIES_MAX} partenaires · description max.{" "}
          {NOS_PARTENAIRES_DESC_MAX} caractères
        </p>
        <Button type="button" size="sm" className="gap-2" onClick={addEntry}>
          <Plus className="h-4 w-4" aria-hidden />
          Ajouter un partenaire
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Aucun partenaire. Utilisez « Ajouter un partenaire » pour commencer.
        </p>
      ) : (
        <div className="space-y-4">
          {entries.map((e, index) => (
            <Card key={e.id} className="overflow-hidden shadow-sm">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 border-b border-border bg-muted/30 py-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Handshake className="h-4 w-4 text-primary" aria-hidden />
                  Partenaire {index + 1}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === 0}
                    aria-label="Monter"
                    onClick={() => moveEntry(index, -1)}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === entries.length - 1}
                    aria-label="Descendre"
                    onClick={() => moveEntry(index, 1)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-destructive hover:text-destructive"
                    onClick={() => removeEntry(index)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Retirer
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <input
                    ref={(el) => {
                      fileRefs.current[e.id] = el;
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={(ev) => void handleLogoFile(index, ev.target.files?.[0])}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={uploadingIndex === index}
                      onClick={() => fileRefs.current[e.id]?.click()}
                    >
                      <ImagePlus className="h-4 w-4" aria-hidden />
                      {uploadingIndex === index ? "Téléversement…" : "Choisir une image"}
                    </Button>
                    {e.logoUrl.trim().length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => patchEntry(index, { logoUrl: "" })}
                      >
                        Retirer le logo
                      </Button>
                    )}
                  </div>
                  <Input
                    value={e.logoUrl}
                    onChange={(ev) => patchEntry(index, { logoUrl: ev.target.value })}
                    placeholder="Ou URL du logo (https://…)"
                  />
                  {e.logoUrl.trim().length > 0 ? (
                    <div className="flex h-20 w-32 items-center justify-center rounded-lg border border-border bg-muted/30 p-2">
                      <img src={e.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`np-nom-${e.id}`}>Nom</Label>
                  <Input
                    id={`np-nom-${e.id}`}
                    value={e.nom}
                    onChange={(ev) => patchEntry(index, { nom: ev.target.value })}
                    placeholder="Nom du partenaire"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`np-url-${e.id}`}>Site web (URL)</Label>
                  <Input
                    id={`np-url-${e.id}`}
                    value={e.websiteUrl}
                    onChange={(ev) => patchEntry(index, { websiteUrl: ev.target.value })}
                    placeholder="https://…"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`np-desc-${e.id}`}>
                    Description (aperçu 10 mots + détail via « Plus », max. {NOS_PARTENAIRES_DESC_MAX})
                  </Label>
                  <Textarea
                    id={`np-desc-${e.id}`}
                    value={e.description}
                    maxLength={NOS_PARTENAIRES_DESC_MAX}
                    rows={4}
                    onChange={(ev) =>
                      patchEntry(index, {
                        description: clampNosPartenairesDescription(ev.target.value),
                      })
                    }
                    placeholder="Présentation du partenaire…"
                    className="min-h-[5rem] resize-y"
                  />
                  <p className="text-right text-xs text-muted-foreground">
                    {e.description.length} / {NOS_PARTENAIRES_DESC_MAX}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
