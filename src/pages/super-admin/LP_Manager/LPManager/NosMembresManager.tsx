import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, ImagePlus, Plus, Trash2, UserSquare2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { uploadLandingPageImage } from "@/lib/lpLandingPageApi";
import {
  clampNosMembresShortDescription,
  createDefaultNosMembresEntry,
  createDefaultNosMembresOrgLink,
  NOS_MEMBRES_ENTRIES_MAX,
  NOS_MEMBRES_ORG_LINKS_MAX,
  NOS_MEMBRES_SHORT_DESC_MAX,
  type NosMembresContent,
  type NosMembresEntry,
  type NosMembresOrgLink,
  type NosMembresOrgLinkKind,
} from "../types";

type NosMembresManagerProps = {
  value: NosMembresContent;
  onChange: (next: NosMembresContent) => void;
};

const LINK_KIND_LABEL: Record<NosMembresOrgLinkKind, string> = {
  website: "Site web",
  linkedin: "LinkedIn",
  instagram: "Instagram",
};

export function NosMembresManager({ value, onChange }: NosMembresManagerProps) {
  const subtitle = value.subtitle ?? "";
  const entries = value.entries ?? [];
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const patchContent = (partial: Partial<NosMembresContent>) => {
    onChange({ ...value, ...partial });
  };

  const patchEntries = (next: NosMembresEntry[]) => {
    patchContent({ entries: next });
  };

  const patchEntry = (index: number, partial: Partial<NosMembresEntry>) => {
    patchEntries(
      entries.map((e, i) => {
        if (i !== index) return e;
        return { ...e, ...partial };
      }),
    );
  };

  const patchOrg = (index: number, partial: Partial<NosMembresEntry["organization"]>) => {
    patchEntries(
      entries.map((e, i) => {
        if (i !== index) return e;
        const org = { ...e.organization, ...partial };
        if (typeof partial.shortDescription === "string") {
          org.shortDescription = clampNosMembresShortDescription(partial.shortDescription);
        }
        return { ...e, organization: org };
      }),
    );
  };

  const patchRep = (index: number, partial: Partial<NosMembresEntry["representative"]>) => {
    patchEntries(
      entries.map((e, i) => {
        if (i !== index) return e;
        return { ...e, representative: { ...e.representative, ...partial } };
      }),
    );
  };

  const patchOrgLinks = (index: number, links: NosMembresOrgLink[]) => {
    patchOrg(index, { links });
  };

  const addEntry = () => {
    if (entries.length >= NOS_MEMBRES_ENTRIES_MAX) {
      toast.error(`Maximum ${NOS_MEMBRES_ENTRIES_MAX} fiches.`);
      return;
    }
    patchEntries([...entries, createDefaultNosMembresEntry(entries.length)]);
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

  const addOrgLink = (index: number) => {
    const e = entries[index];
    if (!e) return;
    const links = e.organization.links ?? [];
    if (links.length >= NOS_MEMBRES_ORG_LINKS_MAX) {
      toast.error(`Maximum ${NOS_MEMBRES_ORG_LINKS_MAX} liens par organisation.`);
      return;
    }
    patchOrgLinks(index, [...links, createDefaultNosMembresOrgLink("website")]);
  };

  const removeOrgLink = (entryIndex: number, linkId: string) => {
    const e = entries[entryIndex];
    if (!e) return;
    patchOrgLinks(
      entryIndex,
      e.organization.links.filter((l) => l.id !== linkId),
    );
  };

  const patchOrgLink = (entryIndex: number, linkId: string, partial: Partial<NosMembresOrgLink>) => {
    const e = entries[entryIndex];
    if (!e) return;
    patchOrgLinks(
      entryIndex,
      e.organization.links.map((l) => (l.id === linkId ? { ...l, ...partial } : l)),
    );
  };

  const handleLogoFile = async (index: number, file: File | undefined) => {
    if (!file) return;
    setUploadingIndex(index);
    try {
      const { url, usedFallback } = await uploadLandingPageImage(file, "nos-membres");
      patchOrg(index, { logoUrl: url });
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
        <Label htmlFor="nos-membres-subtitle">Sous-titre court</Label>
        <Textarea
          id="nos-membres-subtitle"
          value={subtitle}
          rows={3}
          onChange={(ev) => patchContent({ subtitle: ev.target.value })}
          placeholder="Introduction courte de la section Nos membres…"
          className="min-h-[4.5rem] resize-y"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {entries.length} / {NOS_MEMBRES_ENTRIES_MAX} fiches · description max. {NOS_MEMBRES_SHORT_DESC_MAX}{" "}
          caractères
        </p>
        <Button type="button" size="sm" className="gap-2" onClick={addEntry}>
          <Plus className="h-4 w-4" aria-hidden />
          Ajouter une fiche
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Aucune fiche. Utilisez « Ajouter une fiche » pour commencer.
        </p>
      ) : (
        <div className="space-y-4">
          {entries.map((e, index) => (
            <Card key={e.id} className="overflow-hidden shadow-sm">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 border-b border-border bg-muted/30 py-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <UserSquare2 className="h-4 w-4 text-primary" aria-hidden />
                  Membre {index + 1}
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
              <CardContent className="space-y-6 pt-4">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Organisation</h3>
                  <div className="space-y-4">
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
                        {e.organization.logoUrl.trim().length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => patchOrg(index, { logoUrl: "" })}
                          >
                            Retirer le logo
                          </Button>
                        )}
                      </div>
                      <Input
                        value={e.organization.logoUrl}
                        onChange={(ev) => patchOrg(index, { logoUrl: ev.target.value })}
                        placeholder="Ou URL du logo (https://…)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`nm-org-name-${e.id}`}>Nom de l’organisation</Label>
                      <Input
                        id={`nm-org-name-${e.id}`}
                        value={e.organization.name}
                        onChange={(ev) => patchOrg(index, { name: ev.target.value })}
                        placeholder="Nom affiché sur la carte"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`nm-org-desc-${e.id}`}>
                        Description courte (survol de la carte, max. {NOS_MEMBRES_SHORT_DESC_MAX})
                      </Label>
                      <Textarea
                        id={`nm-org-desc-${e.id}`}
                        value={e.organization.shortDescription}
                        maxLength={NOS_MEMBRES_SHORT_DESC_MAX}
                        rows={4}
                        onChange={(ev) =>
                          patchOrg(index, {
                            shortDescription: clampNosMembresShortDescription(ev.target.value),
                          })
                        }
                        placeholder="Présentation de l’organisation…"
                        className="min-h-[5rem] resize-y"
                      />
                      <p className="text-right text-xs text-muted-foreground">
                        {e.organization.shortDescription.length} / {NOS_MEMBRES_SHORT_DESC_MAX}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label>Liens (site, LinkedIn, Instagram)</Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => addOrgLink(index)}>
                          <Plus className="mr-1 h-3.5 w-3.5" aria-hidden />
                          Ajouter un lien
                        </Button>
                      </div>
                      {e.organization.links.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Aucun lien pour l’instant.</p>
                      ) : (
                        <ul className="space-y-2">
                          {e.organization.links.map((link) => (
                            <li
                              key={link.id}
                              className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:items-end"
                            >
                              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Type</Label>
                                  <Select
                                    value={link.kind}
                                    onValueChange={(v) =>
                                      patchOrgLink(index, link.id, {
                                        kind: v as NosMembresOrgLinkKind,
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(Object.keys(LINK_KIND_LABEL) as NosMembresOrgLinkKind[]).map((k) => (
                                        <SelectItem key={k} value={k}>
                                          {LINK_KIND_LABEL[k]}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">URL</Label>
                                  <Input
                                    value={link.url}
                                    onChange={(ev) => patchOrgLink(index, link.id, { url: ev.target.value })}
                                    placeholder="https://…"
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-destructive hover:text-destructive"
                                aria-label="Supprimer ce lien"
                                onClick={() => removeOrgLink(index, link.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Représentant</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`nm-rep-name-${e.id}`}>Nom complet</Label>
                      <Input
                        id={`nm-rep-name-${e.id}`}
                        value={e.representative.fullName}
                        onChange={(ev) => patchRep(index, { fullName: ev.target.value })}
                        placeholder="Prénom Nom"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`nm-rep-pos-${e.id}`}>Poste</Label>
                      <Input
                        id={`nm-rep-pos-${e.id}`}
                        value={e.representative.position}
                        onChange={(ev) => patchRep(index, { position: ev.target.value })}
                        placeholder="Fonction"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`nm-rep-mail-${e.id}`}>E-mail</Label>
                      <Input
                        id={`nm-rep-mail-${e.id}`}
                        type="email"
                        value={e.representative.email}
                        onChange={(ev) => patchRep(index, { email: ev.target.value })}
                        placeholder="contact@…"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`nm-rep-li-${e.id}`}>LinkedIn (URL)</Label>
                      <Input
                        id={`nm-rep-li-${e.id}`}
                        value={e.representative.linkedinUrl}
                        onChange={(ev) => patchRep(index, { linkedinUrl: ev.target.value })}
                        placeholder="https://linkedin.com/in/…"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
