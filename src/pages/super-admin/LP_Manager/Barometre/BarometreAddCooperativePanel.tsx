import { ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
  updateBarometreCooperative,
  uploadBarometreCooperativeImage,
  MAX_COOP_PHONES,
  type BarometreCooperative,
  type CooperativeLink,
  type PresidentGenre,
} from "./barometreCooperativesApi";
import { useBarometreActivities } from "./useBarometreActivities";
import { getActivityMarkerStyle } from "./barometreActivityIcons";
import {
  isValidMoroccoPhone,
  MOROCCO_PHONE_ERROR,
  MOROCCO_PHONE_HINT,
  sanitizeMoroccoPhoneInput,
} from "./barometrePhone";
import { normalizeCooperativeLatLng, parseCoordValue } from "./barometreCoords";

const OTHER_VALUE = "__autre__";

export type CoopFormMapPreview = {
  lat: number;
  lng: number;
  activite: string;
};

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
  /** Édition : même formulaire que l’ajout */
  mode?: "create" | "edit";
  editCooperative?: BarometreCooperative | null;
  editId?: string | null;
  onCancelEdit?: () => void;
  /** Aperçu live du pin sur la carte (X/Y). */
  onMapPreviewChange?: (preview: CoopFormMapPreview | null) => void;
};

function parseOptionalCoord(raw: string): number | null {
  const n = parseCoordValue(raw);
  if (n == null && raw.trim()) return Number.NaN;
  return n;
}

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
  mode = "create",
  editCooperative = null,
  editId = null,
  onCancelEdit,
  onMapPreviewChange,
}: Props) {
  const isEdit = mode === "edit" && Boolean(editId && editCooperative);
  const editHydratedRef = useRef<string | null>(null);

  const { activities, isLoading: activitiesLoading, error: activitiesError } = useBarometreActivities();

  const [coopProvinceOpen, setCoopProvinceOpen] = useState(false);
  const [coopCommuneOpen, setCoopCommuneOpen] = useState(false);

  const [nom, setNom] = useState("");
  const [phones, setPhones] = useState<string[]>([""]);
  const [email, setEmail] = useState("");
  const [adresseDetail, setAdresseDetail] = useState("");
  const [coordX, setCoordX] = useState("");
  const [coordY, setCoordY] = useState("");
  const [activiteKey, setActiviteKey] = useState<string>("");
  const [activiteAutre, setActiviteAutre] = useState("");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState<CooperativeLink[]>([{ url: "", label: "" }]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [presidentGenre, setPresidentGenre] = useState<PresidentGenre | "">("");
  const [presidentNom, setPresidentNom] = useState("");
  const [presidentEmail, setPresidentEmail] = useState("");
  const [presidentTel, setPresidentTel] = useState("");

  const resolvedActivite =
    activiteKey === OTHER_VALUE ? activiteAutre.trim() : activiteKey;

  useEffect(() => {
    if (!onMapPreviewChange) return;
    const lngRaw = parseCoordValue(coordX);
    const latRaw = parseCoordValue(coordY);
    if (lngRaw == null || latRaw == null) {
      onMapPreviewChange(null);
      return;
    }
    const normalized = normalizeCooperativeLatLng(latRaw, lngRaw);
    if (!normalized) {
      onMapPreviewChange(null);
      return;
    }
    onMapPreviewChange({
      lat: normalized.latitude,
      lng: normalized.longitude,
      activite: resolvedActivite || "Autre",
    });
  }, [coordX, coordY, resolvedActivite, onMapPreviewChange]);

  useEffect(() => {
    return () => {
      onMapPreviewChange?.(null);
    };
  }, [onMapPreviewChange]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    editHydratedRef.current = null;
  }, [editId]);

  useEffect(() => {
    if (!isEdit || !editCooperative || !editId || activitiesLoading) return;
    if (editHydratedRef.current === editId) return;
    editHydratedRef.current = editId;

    setNom(editCooperative.nom);
    const loadedPhones =
      editCooperative.phones.length > 0
        ? editCooperative.phones
        : editCooperative.tel
          ? [editCooperative.tel]
          : [""];
    setPhones(
      (loadedPhones.length > 0 ? loadedPhones : [""]).map((p) => sanitizeMoroccoPhoneInput(p) || p),
    );
    setEmail(editCooperative.email);
    const raw = (editCooperative.adresse ?? "").trim();
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length >= 2) {
      setAdresseDetail(lines.slice(0, -1).join("\n"));
    } else {
      setAdresseDetail(raw);
    }

    setCoordX(
      editCooperative.longitude != null && Number.isFinite(editCooperative.longitude)
        ? String(editCooperative.longitude)
        : "",
    );
    setCoordY(
      editCooperative.latitude != null && Number.isFinite(editCooperative.latitude)
        ? String(editCooperative.latitude)
        : "",
    );

    const act = editCooperative.activite.trim();
    if (act && activities.includes(act)) {
      setActiviteKey(act);
      setActiviteAutre("");
    } else if (act) {
      setActiviteKey(OTHER_VALUE);
      setActiviteAutre(act);
    } else {
      setActiviteKey("");
      setActiviteAutre("");
    }

    setDescription(editCooperative.description);
    setLinks(editCooperative.links.length > 0 ? editCooperative.links : [{ url: "", label: "" }]);
    setImageFile(null);
    setImageInputKey((k) => k + 1);
    const g = editCooperative.presidentGenre;
    setPresidentGenre(g === "male" || g === "female" ? g : "");
    setPresidentNom(editCooperative.presidentNomComplet);
    setPresidentEmail(editCooperative.presidentEmail);
    setPresidentTel(sanitizeMoroccoPhoneInput(editCooperative.presidentTel) || editCooperative.presidentTel);
  }, [isEdit, editCooperative, editId, activities, activitiesLoading]);

  const reset = useCallback(() => {
    setNom("");
    setPhones([""]);
    setEmail("");
    setAdresseDetail("");
    setCoordX("");
    setCoordY("");
    setActiviteKey("");
    setActiviteAutre("");
    setDescription("");
    setLinks([{ url: "", label: "" }]);
    setImageFile(null);
    setImageInputKey((k) => k + 1);
    setPresidentGenre("");
    setPresidentNom("");
    setPresidentEmail("");
    setPresidentTel("");
    onCoopProvinceChange(null);
    onCoopCommuneChange(null);
    onMapPreviewChange?.(null);
  }, [onCoopCommuneChange, onCoopProvinceChange, onMapPreviewChange]);

  const markerPreview = getActivityMarkerStyle(resolvedActivite || "Autre");

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

  const saveWithPublish = async (publish: boolean) => {
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

    const lngRaw = parseOptionalCoord(coordX);
    const latRaw = parseOptionalCoord(coordY);
    if (Number.isNaN(lngRaw) || Number.isNaN(latRaw)) {
      toast.error("Coordonnées X/Y invalides. Ex. X (longitude): -8.03 · Y (latitude): 31.51");
      return;
    }
    if ((lngRaw == null) !== (latRaw == null)) {
      toast.error("Renseignez X et Y ensemble, ou laissez les deux vides.");
      return;
    }

    let lng = lngRaw;
    let lat = latRaw;
    if (latRaw != null && lngRaw != null) {
      const normalized = normalizeCooperativeLatLng(latRaw, lngRaw);
      if (!normalized) {
        toast.error(
          "Coordonnées hors WGS84. Latitude entre -90 et 90, longitude entre -180 et 180 (Maroc : Y≈21–36, X≈-17–-1).",
        );
        return;
      }
      lat = normalized.latitude;
      lng = normalized.longitude;
      if (normalized.swapped) {
        toast.info("X/Y semblaient inversés : latitude/longitude ont été corrigées automatiquement.");
        setCoordX(String(lng));
        setCoordY(String(lat));
      }
    }

    const hasCoords = lat != null && lng != null;
    if (!hasCoords) {
      if (!coopProvinceId) {
        toast.error("Sans X/Y : sélectionnez une province, ou renseignez les coordonnées.");
        return;
      }
      if (!coopCommuneId) {
        toast.error("Sans X/Y : sélectionnez une commune, ou renseignez les coordonnées.");
        return;
      }
    }

    const phonesOut = phones.map((p) => sanitizeMoroccoPhoneInput(p)).filter(Boolean);
    if (phonesOut.length > MAX_COOP_PHONES) {
      toast.error(`Maximum ${MAX_COOP_PHONES} numéros de téléphone.`);
      return;
    }
    for (let i = 0; i < phonesOut.length; i++) {
      if (!isValidMoroccoPhone(phonesOut[i]!)) {
        toast.error(
          phonesOut.length > 1
            ? `Téléphone ${i + 1} : ${MOROCCO_PHONE_ERROR}`
            : MOROCCO_PHONE_ERROR,
        );
        return;
      }
    }

    const presNom = presidentNom.trim();
    const presEmail = presidentEmail.trim();
    const presTel = sanitizeMoroccoPhoneInput(presidentTel);
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
      if (presTel && !isValidMoroccoPhone(presTel)) {
        toast.error(`Tél. président(e) : ${MOROCCO_PHONE_ERROR}`);
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
      let imageUrl: string | null = isEdit ? editCooperative?.imageUrl ?? null : null;
      if (imageFile) {
        imageUrl = await uploadBarometreCooperativeImage(imageFile);
      }

      const payload = {
        nom: nameTrim,
        phones: phonesOut,
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
        longitude: lng,
        latitude: lat,
        isPublished: publish,
        presidentGenre: hasAnyPresident ? (presidentGenre as PresidentGenre) : null,
        presidentNomComplet: hasAnyPresident ? presNom : null,
        presidentEmail: hasAnyPresident ? presEmail : null,
        presidentTel: hasAnyPresident ? (presTel || null) : null,
      };

      if (isEdit && editId) {
        await updateBarometreCooperative(editId, payload);
        toast.success(publish ? "Coopérative publiée." : "Brouillon enregistré.");
      } else {
        await insertBarometreCooperative(payload);
        toast.success(publish ? "Coopérative publiée sur la carte." : "Brouillon enregistré.");
        reset();
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          {isEdit ? "Modifier la coopérative" : "Ajouter une coopérative"}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Enregistrez en brouillon ou publiez directement sur la carte publique. Le symbole sur la carte
          suit l&apos;activité choisie.
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
            <div className="space-y-1.5">
              <Label htmlFor="coop-nom">Nom</Label>
              <Input id="coop-nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom de la coopérative" />
            </div>

            <div className="space-y-2">
              <Label>Téléphones (max {MAX_COOP_PHONES})</Label>
              <p className="text-[11px] text-muted-foreground">
                Format : {MOROCCO_PHONE_HINT}
              </p>
              {phones.map((phone, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={phone}
                    onChange={(e) => {
                      const next = [...phones];
                      next[index] = sanitizeMoroccoPhoneInput(e.target.value);
                      setPhones(next);
                    }}
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={13}
                  />
                  {phones.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive"
                      onClick={() => setPhones(phones.filter((_, i) => i !== index))}
                      aria-label="Supprimer ce numéro"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              ))}
              {phones.length < MAX_COOP_PHONES ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setPhones([...phones, ""])}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un numéro
                </Button>
              ) : null}
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
              <p className="text-xs text-muted-foreground">
                Indiquez <span className="font-medium text-foreground">X et Y</span>, ou bien province +
                commune. Avec X/Y, province et commune sont facultatifs — le pin apparaît en direct sur la
                carte.
              </p>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Position (X / Y)</p>
                <p className="text-[11px] text-muted-foreground">
                  X = longitude (ouest, négatif au Maroc) · Y = latitude (nord). Ex. X -8.03 · Y 31.51
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="coop-coord-x" className="text-[10px] text-muted-foreground">
                      X — longitude
                    </Label>
                    <Input
                      id="coop-coord-x"
                      value={coordX}
                      onChange={(e) => setCoordX(e.target.value)}
                      inputMode="decimal"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="coop-coord-y" className="text-[10px] text-muted-foreground">
                      Y — latitude
                    </Label>
                    <Input
                      id="coop-coord-y"
                      value={coordY}
                      onChange={(e) => setCoordY(e.target.value)}
                      inputMode="decimal"
                    />
                  </div>
                </div>
                {parseCoordValue(coordX) != null &&
                parseCoordValue(coordY) != null &&
                normalizeCooperativeLatLng(parseCoordValue(coordY)!, parseCoordValue(coordX)!) ? (
                  <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                    Pin affiché sur la carte
                  </p>
                ) : coordX.trim() || coordY.trim() ? (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Saisissez X et Y valides pour afficher le pin
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Province (optionnel avec X/Y)</p>
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
                <p className="text-xs font-medium text-muted-foreground">Commune (optionnel avec X/Y)</p>
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
              {activiteKey ? (
                <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-muted/20 px-2 py-1.5">
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: markerPreview.pinFill }}
                    aria-hidden
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Symbole carte : couleur / icône « {markerPreview.label} »
                  </p>
                </div>
              ) : null}
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
              {(imagePreview || (isEdit && editCooperative?.imageUrl && !imageFile)) && (
                <img
                  src={imagePreview ?? editCooperative?.imageUrl ?? ""}
                  alt=""
                  className="mt-2 max-h-40 w-auto rounded-md border border-border object-contain"
                />
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
                onChange={(e) => setPresidentTel(sanitizeMoroccoPhoneInput(e.target.value))}
                inputMode="tel"
                autoComplete="tel"
                maxLength={13}
              />
              <p className="text-[11px] text-muted-foreground">Format : {MOROCCO_PHONE_HINT}</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
        {isEdit && onCancelEdit ? (
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancelEdit}>
            Annuler
          </Button>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:min-w-[160px]"
          disabled={isSaving}
          onClick={() => void saveWithPublish(false)}
        >
          {isSaving ? "Enregistrement…" : "Enregistrer en brouillon"}
        </Button>
        <Button
          type="button"
          className="w-full sm:min-w-[160px]"
          disabled={isSaving}
          onClick={() => void saveWithPublish(true)}
        >
          {isSaving ? "Enregistrement…" : isEdit ? "Enregistrer et publier" : "Publier sur la carte"}
        </Button>
      </div>
    </form>
  );
}
