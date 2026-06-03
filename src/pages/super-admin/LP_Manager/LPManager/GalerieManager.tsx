import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, FolderOpen, ImagePlus, Plus, Trash2 } from "lucide-react";
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
  createDefaultGalerieCatalogue,
  createDefaultGalerieImage,
  GALERIE_CATALOGUES_MAX,
  GALERIE_DISPLAY_MODES,
  GALERIE_IMAGES_MAX,
  type GalerieCatalogue,
  type GalerieContent,
  type GalerieDisplayMode,
  type GalerieImage,
} from "../types";

type GalerieManagerProps = {
  value: GalerieContent;
  onChange: (next: GalerieContent) => void;
};

const DISPLAY_MODE_LABEL: Record<GalerieDisplayMode, string> = {
  slider: "Slider (carrousel)",
  catalogue: "Catalogue (grille)",
  collage: "Collage (mosaïque)",
};

export function GalerieManager({ value, onChange }: GalerieManagerProps) {
  const catalogues = value.catalogues ?? [];
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const patchContent = (partial: Partial<GalerieContent>) => {
    onChange({ ...value, ...partial });
  };

  const patchCatalogues = (next: GalerieCatalogue[]) => {
    patchContent({ catalogues: next });
  };

  const patchCatalogue = (index: number, partial: Partial<GalerieCatalogue>) => {
    patchCatalogues(
      catalogues.map((c, i) => (i === index ? { ...c, ...partial } : c)),
    );
  };

  const patchImages = (catIndex: number, images: GalerieImage[]) => {
    patchCatalogue(catIndex, { images });
  };

  const patchImage = (catIndex: number, imgIndex: number, partial: Partial<GalerieImage>) => {
    const cat = catalogues[catIndex];
    if (!cat) return;
    patchImages(
      catIndex,
      cat.images.map((img, i) => (i === imgIndex ? { ...img, ...partial } : img)),
    );
  };

  const addCatalogue = () => {
    if (catalogues.length >= GALERIE_CATALOGUES_MAX) {
      toast.error(`Maximum ${GALERIE_CATALOGUES_MAX} catalogues.`);
      return;
    }
    patchCatalogues([...catalogues, createDefaultGalerieCatalogue(catalogues.length)]);
  };

  const removeCatalogue = (index: number) => {
    patchCatalogues(catalogues.filter((_, i) => i !== index));
  };

  const moveCatalogue = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= catalogues.length) return;
    const next = [...catalogues];
    const t = next[index]!;
    next[index] = next[to]!;
    next[to] = t!;
    patchCatalogues(next);
  };

  const addImage = (catIndex: number) => {
    const cat = catalogues[catIndex];
    if (!cat) return;
    if (cat.images.length >= GALERIE_IMAGES_MAX) {
      toast.error(`Maximum ${GALERIE_IMAGES_MAX} images par catalogue.`);
      return;
    }
    patchImages(catIndex, [...cat.images, createDefaultGalerieImage(cat.images.length)]);
  };

  const removeImage = (catIndex: number, imgIndex: number) => {
    const cat = catalogues[catIndex];
    if (!cat) return;
    patchImages(
      catIndex,
      cat.images.filter((_, i) => i !== imgIndex),
    );
  };

  const moveImage = (catIndex: number, imgIndex: number, dir: -1 | 1) => {
    const cat = catalogues[catIndex];
    if (!cat) return;
    const to = imgIndex + dir;
    if (to < 0 || to >= cat.images.length) return;
    const next = [...cat.images];
    const t = next[imgIndex]!;
    next[imgIndex] = next[to]!;
    next[to] = t!;
    patchImages(catIndex, next);
  };

  const handleImageFiles = async (catIndex: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const cat = catalogues[catIndex];
    if (!cat) return;

    const remaining = GALERIE_IMAGES_MAX - cat.images.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length < files.length) {
      toast.warning(`Seules ${toUpload.length} image(s) ajoutée(s) (limite atteinte).`);
    }

    const newImages: GalerieImage[] = [...cat.images];
    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i]!;
      const key = `${cat.id}-${i}`;
      setUploadingKey(key);
      try {
        const { url, usedFallback } = await uploadLandingPageImage(file, "galerie");
        newImages.push({
          ...createDefaultGalerieImage(newImages.length),
          imageUrl: url,
          title: file.name.replace(/\.[^.]+$/, ""),
        });
        if (usedFallback) {
          toast.warning("Image enregistrée en local", {
            description: "Le stockage distant n’est pas disponible pour cette image.",
          });
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Échec du téléversement");
      } finally {
        setUploadingKey(null);
      }
    }
    patchImages(catIndex, newImages);
    if (toUpload.length > 0) {
      toast.success(`${toUpload.length} image(s) ajoutée(s)`);
    }
    const inputKey = `bulk-${cat.id}`;
    if (fileRefs.current[inputKey]) fileRefs.current[inputKey]!.value = "";
  };

  const handleSingleImageFile = async (catIndex: number, imgIndex: number, file: File | undefined) => {
    if (!file) return;
    const img = catalogues[catIndex]?.images[imgIndex];
    if (!img) return;
    const key = `${img.id}`;
    setUploadingKey(key);
    try {
      const { url, usedFallback } = await uploadLandingPageImage(file, "galerie");
      patchImage(catIndex, imgIndex, { imageUrl: url });
      if (usedFallback) {
        toast.warning("Image enregistrée en local");
      } else {
        toast.success("Image téléversée");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du téléversement");
    } finally {
      setUploadingKey(null);
      if (fileRefs.current[key]) fileRefs.current[key]!.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="galerie-subtitle">Sous-titre de la section</Label>
        <Textarea
          id="galerie-subtitle"
          value={value.subtitle ?? ""}
          rows={2}
          onChange={(ev) => patchContent({ subtitle: ev.target.value })}
          placeholder="Introduction courte de la galerie…"
          className="min-h-[3.5rem] resize-y"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="galerie-display-mode">Mode d’affichage</Label>
        <Select
          value={value.displayMode}
          onValueChange={(v) => patchContent({ displayMode: v as GalerieDisplayMode })}
        >
          <SelectTrigger id="galerie-display-mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GALERIE_DISPLAY_MODES.map((mode) => (
              <SelectItem key={mode} value={mode}>
                {DISPLAY_MODE_LABEL[mode]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Slider : carrousel · Catalogue : grille avec titres · Collage : mosaïque visuelle
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {catalogues.length} / {GALERIE_CATALOGUES_MAX} catalogues
        </p>
        <Button type="button" size="sm" className="gap-2" onClick={addCatalogue}>
          <Plus className="h-4 w-4" aria-hidden />
          Créer un catalogue
        </Button>
      </div>

      {catalogues.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Aucun catalogue. Créez un catalogue avec un nom et une description, puis ajoutez des photos.
        </p>
      ) : (
        <div className="space-y-4">
          {catalogues.map((cat, catIndex) => (
            <Card key={cat.id} className="overflow-hidden shadow-sm">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 border-b border-border bg-muted/30 py-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <FolderOpen className="h-4 w-4 text-primary" aria-hidden />
                  {cat.name.trim() || `Catalogue ${catIndex + 1}`}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={catIndex === 0}
                    aria-label="Monter le catalogue"
                    onClick={() => moveCatalogue(catIndex, -1)}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={catIndex === catalogues.length - 1}
                    aria-label="Descendre le catalogue"
                    onClick={() => moveCatalogue(catIndex, 1)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-destructive hover:text-destructive"
                    onClick={() => removeCatalogue(catIndex)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Supprimer
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`galerie-cat-name-${cat.id}`}>Nom du catalogue</Label>
                    <Input
                      id={`galerie-cat-name-${cat.id}`}
                      value={cat.name}
                      onChange={(ev) => patchCatalogue(catIndex, { name: ev.target.value })}
                      placeholder="Ex. Événements 2025"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`galerie-cat-desc-${cat.id}`}>Description</Label>
                    <Textarea
                      id={`galerie-cat-desc-${cat.id}`}
                      value={cat.description}
                      rows={2}
                      onChange={(ev) => patchCatalogue(catIndex, { description: ev.target.value })}
                      placeholder="Courte description du catalogue…"
                      className="min-h-[3.5rem] resize-y"
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <Label>
                      Photos ({cat.images.length} / {GALERIE_IMAGES_MAX})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={(el) => {
                          fileRefs.current[`bulk-${cat.id}`] = el;
                        }}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        className="sr-only"
                        onChange={(ev) => void handleImageFiles(catIndex, ev.target.files)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={uploadingKey?.startsWith(`${cat.id}`) === true}
                        onClick={() => fileRefs.current[`bulk-${cat.id}`]?.click()}
                      >
                        <ImagePlus className="h-4 w-4" aria-hidden />
                        Ajouter des images
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => addImage(catIndex)}>
                        <Plus className="mr-1 h-3.5 w-3.5" aria-hidden />
                        Photo vide
                      </Button>
                    </div>
                  </div>

                  {cat.images.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                      Aucune photo dans ce catalogue.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {cat.images.map((img, imgIndex) => (
                        <li
                          key={img.id}
                          className="rounded-lg border border-border bg-muted/20 p-3"
                        >
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              Photo {imgIndex + 1}
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={imgIndex === 0}
                                aria-label="Monter la photo"
                                onClick={() => moveImage(catIndex, imgIndex, -1)}
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={imgIndex === cat.images.length - 1}
                                aria-label="Descendre la photo"
                                onClick={() => moveImage(catIndex, imgIndex, 1)}
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                aria-label="Supprimer la photo"
                                onClick={() => removeImage(catIndex, imgIndex)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-[7rem_1fr]">
                            <div className="space-y-2">
                              <input
                                ref={(el) => {
                                  fileRefs.current[img.id] = el;
                                }}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="sr-only"
                                onChange={(ev) =>
                                  void handleSingleImageFile(catIndex, imgIndex, ev.target.files?.[0])
                                }
                              />
                              <div
                                className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40"
                              >
                                {img.imageUrl.trim() ? (
                                  <img
                                    src={img.imageUrl}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <ImagePlus className="h-8 w-8 text-muted-foreground/40" aria-hidden />
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                disabled={uploadingKey === img.id}
                                onClick={() => fileRefs.current[img.id]?.click()}
                              >
                                {uploadingKey === img.id ? "…" : "Choisir"}
                              </Button>
                            </div>
                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs">URL image</Label>
                                <Input
                                  value={img.imageUrl}
                                  onChange={(ev) =>
                                    patchImage(catIndex, imgIndex, { imageUrl: ev.target.value })
                                  }
                                  placeholder="https://…"
                                  className="text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Titre</Label>
                                <Input
                                  value={img.title}
                                  onChange={(ev) =>
                                    patchImage(catIndex, imgIndex, { title: ev.target.value })
                                  }
                                  placeholder="Titre de la photo"
                                  className="text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Description</Label>
                                <Textarea
                                  value={img.description}
                                  rows={2}
                                  onChange={(ev) =>
                                    patchImage(catIndex, imgIndex, { description: ev.target.value })
                                  }
                                  placeholder="Description de la photo…"
                                  className="min-h-[3rem] resize-y text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
