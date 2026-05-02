import { useRef, useState } from "react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadLandingPageImage } from "@/lib/lpLandingPageApi";
import {
  FOOTER_SHORT_TEXT_MAX_CHARS,
  createDefaultFooterQuickNavLink,
  type FooterContent,
  type FooterSocialKey,
} from "../types";

type FooterManagerProps = {
  value: FooterContent;
  onChange: (next: FooterContent) => void;
};

const SOCIAL_ORDER: FooterSocialKey[] = ["facebook", "linkedin", "instagram", "youtube", "x"];

export function FooterManager({ value, onChange }: FooterManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const patch = (partial: Partial<FooterContent>) => onChange({ ...value, ...partial });

  const updateSocial = (key: FooterSocialKey, url: string) => {
    patch({
      socialLinks: value.socialLinks.map((item) => (item.key === key ? { ...item, url } : item)),
    });
  };

  const handleLogo = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url, usedFallback } = await uploadLandingPageImage(file, "footer", "landing_footer");
      patch({ logoUrl: url });
      if (usedFallback) {
        toast.warning("Logo intégré localement");
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
      <div className="space-y-2">
        <Label>Logo</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => void handleLogo(e.target.files?.[0])}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus className="h-4 w-4" aria-hidden />
            {uploading ? "Téléversement..." : "Téléverser"}
          </Button>
          <Button type="button" variant="ghost" className="gap-2" onClick={() => patch({ logoUrl: "" })}>
            <Trash2 className="h-4 w-4" aria-hidden />
            Retirer
          </Button>
        </div>
        <Input
          value={value.logoUrl}
          onChange={(e) => patch({ logoUrl: e.target.value })}
          placeholder="https://.../logo.png"
        />
      </div>

      <div className="space-y-2">
        <Label>Texte court ({value.shortText.length}/{FOOTER_SHORT_TEXT_MAX_CHARS})</Label>
        <Textarea
          value={value.shortText}
          onChange={(e) => patch({ shortText: e.target.value.slice(0, FOOTER_SHORT_TEXT_MAX_CHARS) })}
          placeholder="Description courte du REMESS (250 caractères max)"
          rows={4}
        />
      </div>

      <div className="space-y-3">
        <Label>Réseaux sociaux</Label>
        <div className="grid gap-3 md:grid-cols-2">
          {SOCIAL_ORDER.map((key) => {
            const row = value.socialLinks.find((s) => s.key === key);
            return (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs uppercase text-muted-foreground">{key}</Label>
                <Input
                  value={row?.url ?? ""}
                  onChange={(e) => updateSocial(key, e.target.value)}
                  placeholder={`https://${key}.com/...`}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Quick navigation</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() =>
              patch({
                quickNavigation: [...value.quickNavigation, createDefaultFooterQuickNavLink(value.quickNavigation.length)],
              })
            }
          >
            <Plus className="h-4 w-4" aria-hidden />
            Ajouter
          </Button>
        </div>
        <div className="space-y-3">
          {value.quickNavigation.map((item, index) => (
            <div key={item.id} className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-[1fr_1fr_auto]">
              <Input
                value={item.label}
                onChange={(e) =>
                  patch({
                    quickNavigation: value.quickNavigation.map((x) =>
                      x.id === item.id ? { ...x, label: e.target.value } : x,
                    ),
                  })
                }
                placeholder="Libellé"
              />
              <Input
                value={item.href}
                onChange={(e) =>
                  patch({
                    quickNavigation: value.quickNavigation.map((x) =>
                      x.id === item.id ? { ...x, href: e.target.value } : x,
                    ),
                  })
                }
                placeholder="#lp-section-hero"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={value.quickNavigation.length <= 1}
                onClick={() =>
                  patch({ quickNavigation: value.quickNavigation.filter((_, i) => i !== index) })
                }
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {value.elementsColumns.map((column, colIndex) => (
          <div key={`col-${colIndex}`} className="space-y-2 rounded-lg border border-border p-3">
            <Label>Titre colonne {colIndex + 1}</Label>
            <Input
              value={column.title}
              onChange={(e) =>
                patch({
                  elementsColumns: value.elementsColumns.map((c, i) =>
                    i === colIndex ? { ...c, title: e.target.value } : c,
                  ) as FooterContent["elementsColumns"],
                })
              }
            />
            <Label className="text-xs text-muted-foreground">Un élément par ligne</Label>
            <Textarea
              value={column.items.join("\n")}
              onChange={(e) =>
                patch({
                  elementsColumns: value.elementsColumns.map((c, i) =>
                    i === colIndex
                      ? {
                          ...c,
                          items: e.target.value
                            .split("\n")
                            .map((x) => x.trim())
                            .filter(Boolean),
                        }
                      : c,
                  ) as FooterContent["elementsColumns"],
                })
              }
              rows={6}
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Droits / copyright</Label>
        <Input
          value={value.copyrightText}
          onChange={(e) => patch({ copyrightText: e.target.value })}
          placeholder="REMESS. Tous droits réservés."
        />
      </div>
    </div>
  );
}
