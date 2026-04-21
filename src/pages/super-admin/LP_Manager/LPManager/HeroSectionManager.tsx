import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HeroSectionContent, HeroSlide } from "../types";
import { ensureSlideCount, HERO_SLIDE_COUNT_OPTIONS } from "../types";

type HeroSectionManagerProps = {
  value: HeroSectionContent;
  onChange: (next: HeroSectionContent) => void;
};

function patchSlide(slides: HeroSlide[], index: number, partial: Partial<HeroSlide>): HeroSlide[] {
  return slides.map((s, i) => (i === index ? { ...s, ...partial } : s));
}

function SlideForm({
  slide,
  onChangeSlide,
}: {
  slide: HeroSlide;
  onChangeSlide: (partial: Partial<HeroSlide>) => void;
}) {
  const bg = slide.background;
  const showCtas = slide.showActionButtons !== false;

  const setBgType = (type: "solid" | "gradient" | "image") => {
    if (type === "solid") {
      const color =
        bg.type === "gradient" ? bg.from : bg.type === "solid" ? bg.color : "#4f46e5";
      onChangeSlide({ background: { type: "solid", color } });
    } else if (type === "gradient") {
      const from =
        bg.type === "solid" ? bg.color : bg.type === "gradient" ? bg.from : "#6366f1";
      const to = bg.type === "gradient" ? bg.to : "#1e1b4b";
      const angleDeg = bg.type === "gradient" ? bg.angleDeg : 135;
      onChangeSlide({ background: { type: "gradient", from, to, angleDeg } });
    } else {
      const overlayOpacity = bg.type === "image" ? (bg.overlayOpacity ?? 35) : 35;
      const url = bg.type === "image" ? bg.url : "";
      onChangeSlide({ background: { type: "image", url, overlayOpacity } });
    }
  };

  return (
    <div className="space-y-5 pt-1">
      <div className="space-y-2">
        <Label>Fond</Label>
        <Tabs value={bg.type} onValueChange={(v) => setBgType(v as "solid" | "gradient" | "image")}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="solid">Couleur</TabsTrigger>
            <TabsTrigger value="gradient">Dégradé</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
          </TabsList>
          <TabsContent value="solid" className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Aperçu</Label>
                <input
                  type="color"
                  aria-label="Couleur de fond"
                  className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background"
                  value={bg.type === "solid" ? bg.color : "#4f46e5"}
                  onChange={(e) =>
                    onChangeSlide({ background: { type: "solid", color: e.target.value } })
                  }
                />
              </div>
              <div className="min-w-[8rem] flex-1 space-y-1.5">
                <Label htmlFor={`slide-${slide.id}-hex`} className="text-xs text-muted-foreground">
                  Code hex
                </Label>
                <Input
                  id={`slide-${slide.id}-hex`}
                  value={bg.type === "solid" ? bg.color : ""}
                  onChange={(e) =>
                    onChangeSlide({ background: { type: "solid", color: e.target.value } })
                  }
                  placeholder="#4f46e5"
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="gradient" className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Couleur début</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    aria-label="Couleur début du dégradé"
                    className="h-10 w-14 shrink-0 cursor-pointer rounded-md border border-input"
                    value={bg.type === "gradient" ? bg.from : "#6366f1"}
                    onChange={(e) =>
                      bg.type === "gradient" &&
                      onChangeSlide({
                        background: { ...bg, from: e.target.value },
                      })
                    }
                  />
                  <Input
                    value={bg.type === "gradient" ? bg.from : ""}
                    onChange={(e) =>
                      bg.type === "gradient" &&
                      onChangeSlide({
                        background: { ...bg, from: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Couleur fin</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    aria-label="Couleur fin du dégradé"
                    className="h-10 w-14 shrink-0 cursor-pointer rounded-md border border-input"
                    value={bg.type === "gradient" ? bg.to : "#312e81"}
                    onChange={(e) =>
                      bg.type === "gradient" &&
                      onChangeSlide({
                        background: { ...bg, to: e.target.value },
                      })
                    }
                  />
                  <Input
                    value={bg.type === "gradient" ? bg.to : ""}
                    onChange={(e) =>
                      bg.type === "gradient" &&
                      onChangeSlide({
                        background: { ...bg, to: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`slide-${slide.id}-angle`}>Angle (0–360°)</Label>
              <Input
                id={`slide-${slide.id}-angle`}
                type="number"
                min={0}
                max={360}
                value={bg.type === "gradient" ? bg.angleDeg : 135}
                onChange={(e) => {
                  const angleDeg = Math.min(360, Math.max(0, parseInt(e.target.value, 10) || 0));
                  if (bg.type === "gradient") {
                    onChangeSlide({ background: { ...bg, angleDeg } });
                  }
                }}
              />
            </div>
          </TabsContent>
          <TabsContent value="image" className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`slide-${slide.id}-img-url`} className="text-xs text-muted-foreground">
                URL de l’image
              </Label>
              <Input
                id={`slide-${slide.id}-img-url`}
                value={bg.type === "image" ? bg.url : ""}
                onChange={(e) => {
                  const url = e.target.value;
                  if (bg.type === "image") {
                    onChangeSlide({ background: { ...bg, url } });
                  }
                }}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`slide-${slide.id}-img-overlay`} className="text-xs text-muted-foreground">
                Voile sombre sur l’image (0–100 %)
              </Label>
              <Input
                id={`slide-${slide.id}-img-overlay`}
                type="number"
                min={0}
                max={100}
                value={bg.type === "image" ? (bg.overlayOpacity ?? 35) : 35}
                onChange={(e) => {
                  const overlayOpacity = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                  if (bg.type === "image") {
                    onChangeSlide({ background: { ...bg, overlayOpacity } });
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Renforce le contraste du texte sur la photo. Sans URL, un fond uni de secours
                s’affiche.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`slide-${slide.id}-title`}>Titre</Label>
        <Input
          id={`slide-${slide.id}-title`}
          value={slide.title}
          onChange={(e) => onChangeSlide({ title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`slide-${slide.id}-sub`}>Sous-titre</Label>
        <Textarea
          id={`slide-${slide.id}-sub`}
          value={slide.subtitle}
          onChange={(e) => onChangeSlide({ subtitle: e.target.value })}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`slide-${slide.id}-time`}>Horaires / date (optionnel)</Label>
        <Input
          id={`slide-${slide.id}-time`}
          value={slide.timeLabel}
          onChange={(e) => onChangeSlide({ timeLabel: e.target.value })}
          placeholder="ex. 12 mars 2026 · 18h00"
        />
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
        <div className="space-y-0.5">
          <Label htmlFor={`slide-${slide.id}-show-ctas`} className="text-sm font-medium">
            Boutons d’action
          </Label>
          <p className="text-xs text-muted-foreground">
            Afficher ou masquer le bloc des boutons sur cette diapositive.
          </p>
        </div>
        <Switch
          id={`slide-${slide.id}-show-ctas`}
          checked={showCtas}
          onCheckedChange={(c) => onChangeSlide({ showActionButtons: c })}
        />
      </div>

      {showCtas && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Libellés et liens
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`slide-${slide.id}-p-label`}>Principal — libellé</Label>
              <Input
                id={`slide-${slide.id}-p-label`}
                value={slide.primaryCta.label}
                onChange={(e) =>
                  onChangeSlide({ primaryCta: { ...slide.primaryCta, label: e.target.value } })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`slide-${slide.id}-p-href`}>Principal — lien</Label>
              <Input
                id={`slide-${slide.id}-p-href`}
                value={slide.primaryCta.href}
                onChange={(e) =>
                  onChangeSlide({ primaryCta: { ...slide.primaryCta, href: e.target.value } })
                }
                placeholder="https://…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`slide-${slide.id}-s-label`}>Secondaire — libellé</Label>
              <Input
                id={`slide-${slide.id}-s-label`}
                value={slide.secondaryCta.label}
                onChange={(e) =>
                  onChangeSlide({ secondaryCta: { ...slide.secondaryCta, label: e.target.value } })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`slide-${slide.id}-s-href`}>Secondaire — lien</Label>
              <Input
                id={`slide-${slide.id}-s-href`}
                value={slide.secondaryCta.href}
                onChange={(e) =>
                  onChangeSlide({ secondaryCta: { ...slide.secondaryCta, href: e.target.value } })
                }
                placeholder="https://…"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function HeroSectionManager({ value, onChange }: HeroSectionManagerProps) {
  const patchSettings = (partial: Partial<HeroSectionContent["settings"]>) => {
    onChange({ ...value, settings: { ...value.settings, ...partial } });
  };

  const setSlideCount = (countStr: string) => {
    const count = parseInt(countStr, 10);
    if (Number.isNaN(count)) return;
    onChange({ ...value, slides: ensureSlideCount(count, value.slides) });
  };

  const defaultAccordion = value.slides[0]?.id ?? "0";

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Label htmlFor="lp-hero-slide-count">Nombre de diapositives</Label>
        <Select value={String(value.slides.length)} onValueChange={setSlideCount}>
          <SelectTrigger id="lp-hero-slide-count" className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HERO_SLIDE_COUNT_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} {n === 1 ? "diapositive" : "diapositives"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Chaque diapositive apparaît dans l’accordéon ci-dessous ; le nombre d’entrées suit ce
          réglage.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Navigation du carrousel</h3>
        <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="lp-hero-duration">Durée par diapositive (secondes)</Label>
            <Input
              id="lp-hero-duration"
              type="number"
              min={2}
              max={120}
              step={1}
              value={value.settings.slideDurationSec}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                const slideDurationSec = Number.isNaN(v)
                  ? 2
                  : Math.min(120, Math.max(2, v));
                patchSettings({ slideDurationSec });
              }}
            />
            <p className="text-xs text-muted-foreground">Entre 2 et 120 s. Défilement en pause au survol de l’aperçu.</p>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
            <div className="space-y-0.5">
              <Label htmlFor="lp-hero-arrows" className="text-sm font-medium">
                Flèches de navigation
              </Label>
              <p className="text-xs text-muted-foreground">
                Afficher précédent / suivant lorsqu’il y a au moins 2 diapositives.
              </p>
            </div>
            <Switch
              id="lp-hero-arrows"
              checked={value.settings.showNavArrows}
              onCheckedChange={(c) => patchSettings({ showNavArrows: c })}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Contenu par diapositive</h3>
        <Accordion type="single" collapsible defaultValue={defaultAccordion} className="w-full">
          {value.slides.map((slide, index) => (
            <AccordionItem key={slide.id} value={slide.id}>
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="truncate font-medium">
                    {slide.title.trim() || `Diapositive ${index + 1}`}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <SlideForm
                  slide={slide}
                  onChangeSlide={(partial) => {
                    onChange({ ...value, slides: patchSlide(value.slides, index, partial) });
                  }}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
