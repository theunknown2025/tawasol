import { useId, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  NAVIGABLE_LANDING_SECTION_LABELS,
  createDefaultNavIncludeSection,
} from "../LandingPage/landingPageSectionAnchors";
import { uploadLandingPageImage } from "@/lib/lpLandingPageApi";
import type { HeaderContent, HeaderScrollBehavior, NavigableLandingSectionLabel } from "../types";

type HeaderManagerProps = {
  value: HeaderContent;
  onChange: (next: HeaderContent) => void;
};

export function HeaderManager({ value, onChange }: HeaderManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const urlFieldId = useId();

  /** Anciens brouillons sans ces champs — évite un RadioGroup incontrôlé / cassé. */
  const scrollBehavior: HeaderScrollBehavior = value.scrollBehavior ?? "fixed";
  const navIncludeSection = {
    ...createDefaultNavIncludeSection(),
    ...value.navIncludeSection,
  };

  const patch = (partial: Partial<HeaderContent>) => {
    onChange({
      ...value,
      ...partial,
      scrollBehavior: partial.scrollBehavior ?? value.scrollBehavior ?? "fixed",
      navIncludeSection: {
        ...createDefaultNavIncludeSection(),
        ...value.navIncludeSection,
        ...(partial.navIncludeSection ?? {}),
      },
    });
  };

  const navPatch = (key: NavigableLandingSectionLabel, checked: boolean) => {
    patch({
      navIncludeSection: {
        ...createDefaultNavIncludeSection(),
        ...value.navIncludeSection,
        [key]: checked,
      },
    });
  };

  const navValue = (key: NavigableLandingSectionLabel) => navIncludeSection[key];

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url, usedFallback } = await uploadLandingPageImage(file, "header");
      patch({ logoUrl: url });
      if (usedFallback) {
        toast.warning("Logo enregistré en local", {
          description:
            "Le stockage distant n’est pas disponible : l’image est intégrée pour cette session.",
        });
      } else {
        toast.success("Logo téléversé");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du téléversement");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Logo</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
            {uploading ? "Téléversement…" : "Téléverser un logo"}
          </Button>
          {value.logoUrl.trim().length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => patch({ logoUrl: "" })}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Retirer le logo
            </Button>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={urlFieldId} className="text-xs text-muted-foreground">
            Ou URL du logo
          </Label>
          <Input
            id={urlFieldId}
            value={value.logoUrl}
            onChange={(e) => patch({ logoUrl: e.target.value })}
            placeholder="https://…"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hdr-title">Titre (à côté du logo)</Label>
        <Input
          id="hdr-title"
          value={value.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Nom du site ou de l’organisation"
        />
      </div>

      <Separator />

      <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/[0.06] p-4 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-foreground">Liens vers les sections</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Activez les sections à afficher dans la barre du header (ancres vers la page). Désactivé
            = la section n’apparaît pas dans le menu.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {NAVIGABLE_LANDING_SECTION_LABELS.map((section) => {
            const sid = `hdr-nav-${section.replace(/\s+/g, "-").replace(/'/g, "")}`;
            return (
              <div
                key={section}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-card px-3 py-2.5"
              >
                <Label htmlFor={sid} className="cursor-pointer text-sm font-medium leading-snug">
                  {section}
                </Label>
                <Switch
                  id={sid}
                  checked={navValue(section)}
                  onCheckedChange={(c) => navPatch(section, c)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Affichage
      </p>
      <div className="space-y-5 rounded-lg border border-border px-4 py-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Comportement au scroll</Label>
          <RadioGroup
            value={scrollBehavior}
            onValueChange={(v) => patch({ scrollBehavior: v as HeaderScrollBehavior })}
            className="grid gap-2 sm:grid-cols-2"
          >
            <label
              htmlFor="hdr-scroll-fixed"
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-2 py-2 hover:bg-muted/60"
            >
              <RadioGroupItem value="fixed" id="hdr-scroll-fixed" />
              <div className="text-sm leading-tight">
                <span className="font-medium">Fixe</span>
                <p className="text-xs text-muted-foreground">Reste visible en haut (sticky).</p>
              </div>
            </label>
            <label
              htmlFor="hdr-scroll-hide"
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-2 py-2 hover:bg-muted/60"
            >
              <RadioGroupItem value="disappearing" id="hdr-scroll-hide" />
              <div className="text-sm leading-tight">
                <span className="font-medium">Disparaît au scroll</span>
                <p className="text-xs text-muted-foreground">Se masque en descendant, réapparaît en remontant.</p>
              </div>
            </label>
          </RadioGroup>
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="hdr-show-logo" className="text-sm font-medium">
              Afficher le logo
            </Label>
            <p className="text-xs text-muted-foreground">Zone logo à gauche (ou masquée).</p>
          </div>
          <Switch
            id="hdr-show-logo"
            checked={value.showLogo}
            onCheckedChange={(c) => patch({ showLogo: c })}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="hdr-show-title" className="text-sm font-medium">
              Afficher le titre
            </Label>
            <p className="text-xs text-muted-foreground">Texte à côté du logo.</p>
          </div>
          <Switch
            id="hdr-show-title"
            checked={value.showTitle}
            onCheckedChange={(c) => patch({ showTitle: c })}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="hdr-show-auth" className="text-sm font-medium">
              Boutons Connexion / inscription
            </Label>
            <p className="text-xs text-muted-foreground">Inclure ou masquer le bloc d’actions.</p>
          </div>
          <Switch
            id="hdr-show-auth"
            checked={value.showAuthButtons}
            onCheckedChange={(c) => patch({ showAuthButtons: c })}
          />
        </div>
      </div>

      {value.showAuthButtons && (
        <>
          <Separator />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Actions
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-sm font-medium">Connexion (Login)</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="hdr-login-lbl" className="text-xs text-muted-foreground">
                    Libellé
                  </Label>
                  <Input
                    id="hdr-login-lbl"
                    value={value.loginCta.label}
                    onChange={(e) =>
                      patch({ loginCta: { ...value.loginCta, label: e.target.value } })
                    }
                    placeholder="Connexion"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hdr-login-href" className="text-xs text-muted-foreground">
                    Lien
                  </Label>
                  <Input
                    id="hdr-login-href"
                    value={value.loginCta.href}
                    onChange={(e) =>
                      patch({ loginCta: { ...value.loginCta, href: e.target.value } })
                    }
                    placeholder="/auth"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-sm font-medium">Inscription (Sign up)</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="hdr-sign-lbl" className="text-xs text-muted-foreground">
                    Libellé
                  </Label>
                  <Input
                    id="hdr-sign-lbl"
                    value={value.signInCta.label}
                    onChange={(e) =>
                      patch({ signInCta: { ...value.signInCta, label: e.target.value } })
                    }
                    placeholder="S'inscrire"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hdr-sign-href" className="text-xs text-muted-foreground">
                    Lien
                  </Label>
                  <Input
                    id="hdr-sign-href"
                    value={value.signInCta.href}
                    onChange={(e) =>
                      patch({ signInCta: { ...value.signInCta, href: e.target.value } })
                    }
                    placeholder="/auth"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
