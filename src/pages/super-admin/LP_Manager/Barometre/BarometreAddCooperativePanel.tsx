import { ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { BoundaryFeature } from "./useAdminBoundaries";
import {
  insertBarometreCooperative,
  uploadBarometreCooperativeImage,
  type CooperativeLink,
  type PresidentGenre,
} from "./barometreCooperativesApi";
import { useBarometreActivities } from "./useBarometreActivities";

const OTHER_VALUE = "__autre__";

type Props = {
  onSaved: () => void;
  provincesSorted: BoundaryFeature[];
  communesInCoopProvince: BoundaryFeature[];
  coopProvinceId: string | null;
  coopCommuneId: string | null;
  onCoopProvinceChange: (id: string | null) => void;
  onCoopCommuneChange: (id: string | null) => void;
  coopProvinceLabel: string | null;
  coopCommuneLabel: string | null;
};

export default function BarometreAddCooperativePanel({
  onSaved,
  provincesSorted,
  communesInCoopProvince,
  coopProvinceId,
  coopCommuneId,
  onCoopProvinceChange,
  onCoopCommuneChange,
  coopProvinceLabel,
  coopCommuneLabel,
}: Props) {
  const { activities, isLoading: activitiesLoading, error: activitiesError } = useBarometreActivities();

  const [coopProvinceOpen, setCoopProvinceOpen] = useState(false);
  const [coopCommuneOpen, setCoopCommuneOpen] = useState(false);

  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [adresseDetail, setAdresseDetail] = useState("");
  const [activiteKey, setActiviteKey] = useState<string>("");
  const [activiteAutre, setActiviteAutre] = useState("");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState<CooperativeLink[]>([{ url: "", label: "" }]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [presidentGenre, setPresidentGenre] = useState<PresidentGenre | "">("");
  const [presidentNom, setPresidentNom] = useState("");
  const [presidentEmail, setPresidentEmail] = useState("");
  const [presidentTel, setPresidentTel] = useState("");

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const reset = useCallback(() => {
    setNom("");
    setTel("");
    setEmail("");
    setAdresseDetail("");
    setActiviteKey("");
    setActiviteAutre("");
    setDescription("");
    setLinks([{ url: "", label: "" }]);
    setImageFile(null);
    setImageInputKey((k) => k + 1);
    setIsPublished(true);
    setPresidentGenre("");
    setPresidentNom("");
    setPresidentEmail("");
    setPresidentTel("");
    onCoopProvinceChange(null);
    onCoopCommuneChange(null);
  }, [onCoopCommuneChange, onCoopProvinceChange]);

  const resolvedActivite =
    activiteKey === OTHER_VALUE ? activiteAutre.trim() : activiteKey;

  const onImageChange = (file: File | null) => {
    if (!file) {
      setImageFile(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez choisir un fichier image.");
      return;
    }
    setImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrim = nom.trim();
    if (!nameTrim) {
      toast.error("Le nom est obligatoire.");
      return;
    }
    if (!activiteKey) {
      toast.error("Choisissez une activité.");
      return;
    }
    if (activiteKey === OTHER_VALUE && !activiteAutre.trim()) {
      toast.error("Précisez l'activité pour « Autre ».");
      return;
    }
    if (!coopProvinceId) {
      toast.error("Sélectionnez une province pour l'adresse.");
      return;
    }
    if (!coopCommuneId) {
      toast.error("Sélectionnez une commune pour l'adresse.");
      return;
    }

    const presNom = presidentNom.trim();
    const presEmail = presidentEmail.trim();
    const presTel = presidentTel.trim();
    const hasAnyPresident = Boolean(presidentGenre || presNom || presEmail || presTel);
    if (hasAnyPresident) {
      if (presidentGenre !== "male" && presidentGenre !== "female") {
        toast.error("Sélectionnez le genre du ou de la président(e).");
        return;
      }
      if (!presNom) {
        toast.error("Nom complet du ou de la président(e) requis.");
        return;
      }
      if (!presEmail) {
        toast.error("Email du ou de la président(e) requis.");
        return;
      }
    }

    const linksOut: CooperativeLink[] = links
      .map((l) => ({
        url: l.url.trim(),
        label: l.label.trim(),
      }))
      .filter((l) => l.url.length > 0);

    const locality = [coopCommuneLabel, coopProvinceLabel].filter(Boolean).join(", ");
    const adresseComposed = [adresseDetail.trim(), locality].filter(Boolean).join("\n");

    setIsSaving(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadBarometreCooperativeImage(imageFile);
      }

      await insertBarometreCooperative({
        nom: nameTrim,
        tel: tel.trim(),
        email: email.trim(),
        adresse: adresseComposed,
        activite: resolvedActivite,
        description: description.trim(),
        links: linksOut,
        imageUrl,
        provinceId: coopProvinceId,
        communeId: coopCommuneId,
        provinceName: coopProvinceLabel,
        communeName: coopCommuneLabel,
        isPublished,
        presidentGenre: hasAnyPresident ? (presidentGenre as PresidentGenre) : null,
        presidentNomComplet: hasAnyPresident ? presNom : null,
        presidentEmail: hasAnyPresident ? presEmail : null,
        presidentTel: hasAnyPresident ? (presTel || null) : null,
      });

      toast.success("Coopérative enregistrée.");
      reset();
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Ajouter une coopérative</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Carte publique : seules les fiches « visibles » sont lisibles sans compte (RLS). Images : bucket{" "}
          <code className="rounded bg-muted px-1 text-[10px]">barometre_cooperative_images</code>.
        </p>
      </div>

      {activitiesError && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {activitiesError}
        </p>
      )}

      <Accordion type="multiple" defaultValue={["cooperative", "president"]} className="rounded-md border border-border px-2">
        <AccordionItem value="cooperative" className="border-b-0">
          <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
            Coopérative
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/20 px-3 py-2">
              <div className="space-y-0.5">
                <Label htmlFor="coop-published" className="text-xs font-medium">
                  Visible sur la carte publique
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Désactiver pour masquer la fiche aux visiteurs (données toujours visibles ici).
                </p>
              </div>
              <Switch id="coop-published" checked={isPublished} onCheckedChange={setIsPublished} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coop-nom">Nom</Label>
              <Input id="coop-nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom de la coopérative" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coop-tel">Tél</Label>
              <Input id="coop-tel" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="+212 …" inputMode="tel" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coop-email">Email</Label>
              <Input
                id="coop-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@…"
              />
            </div>

            <div className="space-y-3 rounded-md border border-border bg-muted/10 p-3">
              <Label className="text-foreground">Adresse</Label>
              <p className="text-xs text-muted-foreground">Repère sur la carte selon la commune choisie.</p>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Province</p>
                <Popover open={coopProvinceOpen} onOpenChange={setCoopProvinceOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={coopProvinceOpen}
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate text-left">
                        {coopProvinceLabel ?? "Rechercher une province..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[min(100vw-2rem,380px)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Rechercher une province..." />
                      <CommandList>
                        <CommandEmpty>Aucune province.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="__clear_coop_province__"
                            onSelect={() => {
                              onCoopProvinceChange(null);
                              onCoopCommuneChange(null);
                              setCoopProvinceOpen(false);
                            }}
                          >
                            Effacer la province
                          </CommandItem>
                          {provincesSorted.map((p) => (
                            <CommandItem
                              key={p.properties.id}
                              value={`${p.properties.name} ${p.properties.id}`}
                              onSelect={() => {
                                onCoopProvinceChange(p.properties.id);
                                onCoopCommuneChange(null);
                                setCoopProvinceOpen(false);
                              }}
                            >
                              {p.properties.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Commune</p>
                <Popover open={coopCommuneOpen} onOpenChange={setCoopCommuneOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={coopCommuneOpen}
                      className="w-full justify-between font-normal"
                      disabled={!coopProvinceId}
                    >
                      <span className="truncate text-left">
                        {!coopProvinceId
                          ? "Sélectionnez d'abord une province"
                          : (coopCommuneLabel ?? "Rechercher une commune...")}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[min(100vw-2rem,380px)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Rechercher une commune..." disabled={!coopProvinceId} />
                      <CommandList>
                        <CommandEmpty>Aucune commune dans cette province.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="__clear_coop_commune__"
                            disabled={!coopProvinceId}
                            onSelect={() => {
                              onCoopCommuneChange(null);
                              setCoopCommuneOpen(false);
                            }}
                          >
                            Effacer la commune
                          </CommandItem>
                          {communesInCoopProvince.map((c) => (
                            <CommandItem
                              key={c.properties.id}
                              value={`${c.properties.name} ${c.properties.id}`}
                              onSelect={() => {
                                onCoopCommuneChange(c.properties.id);
                                setCoopCommuneOpen(false);
                              }}
                            >
                              {c.properties.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="coop-adresse-detail">Complément d&apos;adresse</Label>
                <Textarea
                  id="coop-adresse-detail"
                  value={adresseDetail}
                  onChange={(e) => setAdresseDetail(e.target.value)}
                  placeholder="Rue, n°, quartier…"
                  rows={2}
                  className="resize-y min-h-[56px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Activité</Label>
              <Select
                value={activiteKey}
                onValueChange={(v) => setActiviteKey(v)}
                disabled={activitiesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={activitiesLoading ? "Chargement…" : "Choisir une activité"} />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                  <SelectItem value={OTHER_VALUE}>Autre</SelectItem>
                </SelectContent>
              </Select>
              {activiteKey === OTHER_VALUE && (
                <Input
                  className="mt-2"
                  value={activiteAutre}
                  onChange={(e) => setActiviteAutre(e.target.value)}
                  placeholder="Précisez l'activité"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coop-desc">Description</Label>
              <Textarea
                id="coop-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Présentation courte"
                rows={4}
                className="resize-y min-h-[96px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Liens</Label>
              {links.map((link, index) => (
                <div key={index} className="flex flex-col gap-2 rounded-md border border-border bg-background p-2 sm:flex-row sm:items-end">
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    <Input
                      value={link.label}
                      onChange={(e) => {
                        const next = [...links];
                        next[index] = { ...next[index], label: e.target.value };
                        setLinks(next);
                      }}
                      placeholder="Libellé (optionnel)"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) => {
                        const next = [...links];
                        next[index] = { ...next[index], url: e.target.value };
                        setLinks(next);
                      }}
                      placeholder="https://…"
                      inputMode="url"
                    />
                  </div>
                  {links.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive"
                      onClick={() => setLinks(links.filter((_, i) => i !== index))}
                      aria-label="Supprimer ce lien"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setLinks([...links, { url: "", label: "" }])}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un lien
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coop-image">Image</Label>
              <Input
                key={imageInputKey}
                id="coop-image"
                type="file"
                accept="image/*"
                onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
              />
              {imagePreview && (
                <img src={imagePreview} alt="" className="mt-2 max-h-40 w-auto rounded-md border border-border object-contain" />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="president" className="border-b-0">
          <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
            Président(e)
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-xs text-muted-foreground">
              Optionnel. Si un champ est renseigné, genre, nom complet et email deviennent obligatoires (téléphone facultatif).
            </p>
            <div className="space-y-1.5">
              <Label>Genre</Label>
              <Select
                value={presidentGenre || "__none__"}
                onValueChange={(v) =>
                  setPresidentGenre(v === "__none__" ? "" : (v as PresidentGenre))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pres-nom">Nom complet</Label>
              <Input
                id="pres-nom"
                value={presidentNom}
                onChange={(e) => setPresidentNom(e.target.value)}
                placeholder="Prénom et nom"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pres-email">Email</Label>
              <Input
                id="pres-email"
                type="email"
                value={presidentEmail}
                onChange={(e) => setPresidentEmail(e.target.value)}
                placeholder="president@…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pres-tel">Tél (optionnel)</Label>
              <Input
                id="pres-tel"
                value={presidentTel}
                onChange={(e) => setPresidentTel(e.target.value)}
                placeholder="+212 …"
                inputMode="tel"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button type="submit" className="w-full" disabled={isSaving}>
        {isSaving ? "Enregistrement…" : "Enregistrer la coopérative"}
      </Button>
    </form>
  );
}
