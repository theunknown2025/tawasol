import { useRef, useState } from "react";
import {
  Award,
  Compass,
  FileUp,
  Globe2,
  Handshake,
  Heart,
  Leaf,
  Lightbulb,
  Plus,
  Shield,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { uploadLandingPagePdf } from "@/lib/lpLandingPageApi";
import {
  A_PROPOS_VALEUR_ICON_KEYS,
  A_PROPOS_VALEURS_MAX,
  A_PROPOS_VALEURS_MIN,
  createDefaultAProposValeur,
  ensureAProposValeursCount,
  type AProposRemessContent,
  type AProposValeurIconKey,
  type AProposValeurItem,
} from "../types";

const VALEUR_ICONS: Record<AProposValeurIconKey, LucideIcon> = {
  heart: Heart,
  shield: Shield,
  lightbulb: Lightbulb,
  users: Users,
  handshake: Handshake,
  target: Target,
  leaf: Leaf,
  award: Award,
  sparkles: Sparkles,
  globe2: Globe2,
  trendingUp: TrendingUp,
  compass: Compass,
};

type AProposRemessManagerProps = {
  value: AProposRemessContent;
  onChange: (next: AProposRemessContent) => void;
};

export function AProposRemessManager({ value, onChange }: AProposRemessManagerProps) {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [pdfUploading, setPdfUploading] = useState(false);

  const patch = (partial: Partial<AProposRemessContent>) => {
    const next: AProposRemessContent = { ...value, ...partial };
    if (partial.valeurs !== undefined) {
      next.valeurs = ensureAProposValeursCount(partial.valeurs);
    }
    onChange(next);
  };

  const patchValeur = (id: string, partial: Partial<AProposValeurItem>) => {
    patch({
      valeurs: value.valeurs.map((v) => (v.id === id ? { ...v, ...partial } : v)),
    });
  };

  const addValeur = () => {
    if (value.valeurs.length >= A_PROPOS_VALEURS_MAX) return;
    patch({
      valeurs: ensureAProposValeursCount([
        ...value.valeurs,
        createDefaultAProposValeur(value.valeurs.length),
      ]),
    });
  };

  const removeValeur = (id: string) => {
    if (value.valeurs.length <= A_PROPOS_VALEURS_MIN) return;
    patch({ valeurs: value.valeurs.filter((v) => v.id !== id) });
  };

  const handlePdf = async (file: File | undefined) => {
    if (!file) return;
    setPdfUploading(true);
    try {
      const { url } = await uploadLandingPagePdf(file, "a-propos-mission");
      patch({ missionDocumentUrl: url, missionActionKind: "document" });
      toast.success("Document téléversé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du téléversement");
    } finally {
      setPdfUploading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Mission du REMESS</h3>
        <div className="space-y-2">
          <Label htmlFor="apr-eyebrow">Sur-titre (optionnel)</Label>
          <Input
            id="apr-eyebrow"
            value={value.missionEyebrow}
            onChange={(e) => patch({ missionEyebrow: e.target.value })}
            placeholder="ex. À propos"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="apr-title">Titre</Label>
          <Input
            id="apr-title"
            value={value.missionTitle}
            onChange={(e) => patch({ missionTitle: e.target.value })}
            placeholder="Mission du REMESS"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="apr-statement">Texte de mission</Label>
          <Textarea
            id="apr-statement"
            value={value.missionStatement}
            onChange={(e) => patch({ missionStatement: e.target.value })}
            rows={6}
            placeholder="Décrivez la mission…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="apr-cta-label">Libellé du bouton d’action</Label>
          <Input
            id="apr-cta-label"
            value={value.missionActionLabel}
            onChange={(e) => patch({ missionActionLabel: e.target.value })}
            placeholder="ex. Consulter la charte"
          />
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <Label className="text-foreground">Cible du bouton</Label>
          <RadioGroup
            value={value.missionActionKind}
            onValueChange={(v) =>
              patch({ missionActionKind: v === "document" ? "document" : "link" })
            }
            className="grid gap-3 sm:grid-cols-2"
          >
            <div className="flex items-center gap-2 rounded-lg border border-transparent px-1 py-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
              <RadioGroupItem value="link" id="apr-kind-link" />
              <Label htmlFor="apr-kind-link" className="cursor-pointer font-normal">
                Lien (URL)
              </Label>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-transparent px-1 py-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
              <RadioGroupItem value="document" id="apr-kind-doc" />
              <Label htmlFor="apr-kind-doc" className="cursor-pointer font-normal">
                Document (PDF)
              </Label>
            </div>
          </RadioGroup>

          {value.missionActionKind === "link" ? (
            <div className="space-y-2 pt-1">
              <Label htmlFor="apr-href">URL du lien</Label>
              <Input
                id="apr-href"
                value={value.missionActionHref}
                onChange={(e) => patch({ missionActionHref: e.target.value })}
                placeholder="https://…"
              />
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={(e) => void handlePdf(e.target.files?.[0])}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={pdfUploading}
                  onClick={() => pdfInputRef.current?.click()}
                >
                  <FileUp className="h-4 w-4" aria-hidden />
                  {pdfUploading ? "Téléversement…" : "Téléverser un PDF"}
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="apr-doc-url">Ou URL du document</Label>
                <Input
                  id="apr-doc-url"
                  value={value.missionDocumentUrl}
                  onChange={(e) => patch({ missionDocumentUrl: e.target.value })}
                  placeholder="https://…/document.pdf"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Nos valeurs</h3>
            <p className="text-xs text-muted-foreground">
              Entre {A_PROPOS_VALEURS_MIN} et {A_PROPOS_VALEURS_MAX} valeurs — titre, description et
              icône.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1.5"
            disabled={value.valeurs.length >= A_PROPOS_VALEURS_MAX}
            onClick={addValeur}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Ajouter
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apr-valeurs-title">Titre du bloc (à droite sur la page)</Label>
          <Input
            id="apr-valeurs-title"
            value={value.valeursSectionTitle}
            onChange={(e) => patch({ valeursSectionTitle: e.target.value })}
            placeholder="Nos Valeurs"
          />
        </div>

        <div className="space-y-4">
          {value.valeurs.map((v, index) => (
            <div
              key={v.id}
              className="space-y-3 rounded-xl border border-border bg-background p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Valeur {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={value.valeurs.length <= A_PROPOS_VALEURS_MIN}
                  title={
                    value.valeurs.length <= A_PROPOS_VALEURS_MIN
                      ? `Minimum ${A_PROPOS_VALEURS_MIN} valeurs`
                      : "Retirer cette valeur"
                  }
                  onClick={() => removeValeur(v.id)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`apr-v-title-${v.id}`}>Nom</Label>
                  <Input
                    id={`apr-v-title-${v.id}`}
                    value={v.title}
                    onChange={(e) => patchValeur(v.id, { title: e.target.value })}
                    placeholder="ex. Solidarité"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icône</Label>
                  <Select
                    value={v.iconKey}
                    onValueChange={(key) =>
                      patchValeur(v.id, { iconKey: key as AProposValeurIconKey })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une icône" />
                    </SelectTrigger>
                    <SelectContent>
                      {A_PROPOS_VALEUR_ICON_KEYS.map((key) => {
                        const Icon = VALEUR_ICONS[key];
                        return (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-primary" aria-hidden />
                              <span className="capitalize">{key}</span>
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`apr-v-desc-${v.id}`}>Description</Label>
                <Textarea
                  id={`apr-v-desc-${v.id}`}
                  value={v.description}
                  onChange={(e) => patchValeur(v.id, { description: e.target.value })}
                  rows={3}
                  placeholder="Texte court affiché sous le nom…"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
