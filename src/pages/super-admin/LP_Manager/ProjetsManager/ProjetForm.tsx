import { useRef, useState } from "react";
import {
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  slideBackgroundStyle,
  type AProposValeurIconKey,
  type HeroSlideBackground,
} from "@/pages/super-admin/LP_Manager/types";
import {
  createEmptyLpProjetPartner,
  createEmptyLpProjetResult,
  type LpProjetInput,
  type LpProjetPartner,
  type LpProjetResult,
} from "@/types/lpProjet";
import { uploadLpProjetBanner, uploadLpProjetPartnerLogo } from "@/lib/lpProjetsApi";
import { A_PROPOS_VALEUR_ICON_KEYS, LP_PROJET_RESULT_ICONS } from "./projetResultIcons";
import { toast } from "sonner";

type ProjetFormProps = {
  value: LpProjetInput;
  onChange: (next: LpProjetInput) => void;
  onSubmit: () => void;
  submitLabel: string;
  isSubmitting?: boolean;
};

export function ProjetForm({
  value,
  onChange,
  onSubmit,
  submitLabel,
  isSubmitting,
}: ProjetFormProps) {
  const bannerRef = useRef<HTMLInputElement>(null);
  const partnerLogoRef = useRef<HTMLInputElement>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [partnerLogoUploading, setPartnerLogoUploading] = useState(false);
  const [zoneDraft, setZoneDraft] = useState("");
  const [partnerLogoTargetId, setPartnerLogoTargetId] = useState<string | null>(null);

  const patch = (partial: Partial<LpProjetInput>) => {
    onChange({ ...value, ...partial });
  };

  const patchResult = (id: string, partial: Partial<LpProjetResult>) => {
    patch({
      results: value.results.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    });
  };

  const patchPartner = (id: string, partial: Partial<LpProjetPartner>) => {
    patch({
      partners: value.partners.map((p) => (p.id === id ? { ...p, ...partial } : p)),
    });
  };

  const handleBannerUpload = async (file: File | undefined) => {
    if (!file) return;
    setBannerUploading(true);
    try {
      const url = await uploadLpProjetBanner(file);
      const next: HeroSlideBackground = {
        type: "image",
        url,
        overlayOpacity: value.banner.type === "image" ? value.banner.overlayOpacity ?? 35 : 35,
        positionY: value.banner.type === "image" ? value.banner.positionY ?? 50 : 50,
      };
      patch({ banner: next });
      toast.success("Bannière téléversée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du téléversement");
    } finally {
      setBannerUploading(false);
      if (bannerRef.current) bannerRef.current.value = "";
    }
  };

  const handlePartnerLogoUpload = async (file: File | undefined) => {
    if (!file || !partnerLogoTargetId) return;
    setPartnerLogoUploading(true);
    try {
      const url = await uploadLpProjetPartnerLogo(file);
      patchPartner(partnerLogoTargetId, { logoUrl: url });
      toast.success("Logo téléversé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du téléversement");
    } finally {
      setPartnerLogoUploading(false);
      setPartnerLogoTargetId(null);
      if (partnerLogoRef.current) partnerLogoRef.current.value = "";
    }
  };

  const addZone = () => {
    const tag = zoneDraft.trim();
    if (!tag) return;
    if (value.zones.some((z) => z.toLowerCase() === tag.toLowerCase())) {
      toast.error("Cette zone existe déjà");
      return;
    }
    patch({ zones: [...value.zones, tag] });
    setZoneDraft("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.title.trim()) {
      toast.error("Le titre du projet est obligatoire");
      return;
    }
    onSubmit();
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="projet-title">Titre du projet</Label>
        <Input
          id="projet-title"
          value={value.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Ex. Programme d’appui à l’ESS"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Bannière</Label>
        <input
          ref={bannerRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(ev) => void handleBannerUpload(ev.target.files?.[0])}
        />
        <div
          className="relative aspect-[16/7] w-full overflow-hidden rounded-xl border border-border"
          style={slideBackgroundStyle(value.banner)}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-2"
              disabled={bannerUploading}
              onClick={() => bannerRef.current?.click()}
            >
              {bannerUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {bannerUploading ? "Téléversement…" : "Choisir une image"}
            </Button>
            {value.banner.type === "image" && value.banner.url ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => patch({ banner: { type: "solid", color: "#0f766e" } })}
              >
                Retirer l’image
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="projet-debut">Date de début</Label>
          <Input
            id="projet-debut"
            type="date"
            value={value.dateDebut ?? ""}
            onChange={(e) => patch({ dateDebut: e.target.value || null })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projet-fin">Date de fin</Label>
          <Input
            id="projet-fin"
            type="date"
            value={value.dateFin ?? ""}
            onChange={(e) => patch({ dateFin: e.target.value || null })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="projet-description">Description</Label>
        <Textarea
          id="projet-description"
          value={value.description}
          onChange={(e) => patch({ description: e.target.value })}
          rows={6}
          placeholder="Présentez le projet, son contexte et ses objectifs…"
        />
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Résultats</h3>
            <p className="text-xs text-muted-foreground">Nombre, icône et titre pour chaque réalisation.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => patch({ results: [...value.results, createEmptyLpProjetResult()] })}
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
        {value.results.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun résultat pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {value.results.map((result) => {
              const Icon = LP_PROJET_RESULT_ICONS[result.iconKey];
              return (
                <li
                  key={result.id}
                  className="grid gap-3 rounded-lg border border-border/80 bg-muted/20 p-3 sm:grid-cols-[7rem_10rem_1fr_auto]"
                >
                  <div className="space-y-1">
                    <Label className="text-xs">Nombre</Label>
                    <Input
                      value={result.numberValue}
                      onChange={(e) => patchResult(result.id, { numberValue: e.target.value })}
                      placeholder="120"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Icône</Label>
                    <Select
                      value={result.iconKey}
                      onValueChange={(key) =>
                        patchResult(result.id, { iconKey: key as AProposValeurIconKey })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {A_PROPOS_VALEUR_ICON_KEYS.map((key) => {
                          const ItemIcon = LP_PROJET_RESULT_ICONS[key];
                          return (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                <ItemIcon className="h-4 w-4 text-primary" />
                                <span className="capitalize">{key}</span>
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Titre</Label>
                    <div className="flex items-center gap-2">
                      <Icon className="hidden h-4 w-4 shrink-0 text-primary sm:block" />
                      <Input
                        value={result.title}
                        onChange={(e) => patchResult(result.id, { title: e.target.value })}
                        placeholder="Bénéficiaires formés"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="self-end text-destructive"
                    onClick={() =>
                      patch({ results: value.results.filter((r) => r.id !== result.id) })
                    }
                    aria-label="Supprimer le résultat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <div>
          <h3 className="text-sm font-semibold">Zone d’intervention</h3>
          <p className="text-xs text-muted-foreground">Ajoutez des tags (région, province…).</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {value.zones.map((zone) => (
            <Badge key={zone} variant="secondary" className="gap-1 pr-1">
              {zone}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-muted"
                onClick={() => patch({ zones: value.zones.filter((z) => z !== zone) })}
                aria-label={`Retirer ${zone}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={zoneDraft}
            onChange={(e) => setZoneDraft(e.target.value)}
            placeholder="Ex. Casablanca-Settat"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addZone();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addZone}>
            Ajouter
          </Button>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Bailleurs de fonds / Partenaires</h3>
            <p className="text-xs text-muted-foreground">Nom et logo pour chaque partenaire.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => patch({ partners: [...value.partners, createEmptyLpProjetPartner()] })}
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
        <input
          ref={partnerLogoRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(ev) => void handlePartnerLogoUpload(ev.target.files?.[0])}
        />
        {value.partners.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun partenaire pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {value.partners.map((partner) => (
              <li
                key={partner.id}
                className="flex flex-wrap items-end gap-3 rounded-lg border border-border/80 bg-muted/20 p-3"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                  {partner.logoUrl ? (
                    <img src={partner.logoUrl} alt="" className="h-full w-full object-contain p-1" />
                  ) : (
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-[12rem] flex-1 space-y-1">
                  <Label className="text-xs">Nom</Label>
                  <Input
                    value={partner.name}
                    onChange={(e) => patchPartner(partner.id, { name: e.target.value })}
                    placeholder="Nom du bailleur / partenaire"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={partnerLogoUploading}
                  onClick={() => {
                    setPartnerLogoTargetId(partner.id);
                    partnerLogoRef.current?.click();
                  }}
                >
                  {partnerLogoUploading && partnerLogoTargetId === partner.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  Logo
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() =>
                    patch({ partners: value.partners.filter((p) => p.id !== partner.id) })
                  }
                  aria-label="Supprimer le partenaire"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Publier sur le site</p>
          <p className="text-xs text-muted-foreground">
            Visible sur la landing et les pages publiques `/projets`.
          </p>
        </div>
        <Switch
          checked={value.status === "published"}
          onCheckedChange={(checked) => patch({ status: checked ? "published" : "draft" })}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="gap-2">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
