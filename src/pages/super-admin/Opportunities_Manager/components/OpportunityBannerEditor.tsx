import { Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { HeroSlideBackground } from "@/pages/super-admin/LP_Manager/types";
import { OpportunityPublicBannerFrame, OpportunityPublicBannerWidthShell } from "./OpportunityPublicBannerFrame";
import { OPPORTUNITY_BANNER_SPECS } from "../opportunityBannerSpecs";

type OpportunityBannerEditorProps = {
  value: HeroSlideBackground;
  onChange: (next: HeroSlideBackground) => void;
  onImageUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
};

function imagePositionY(banner: Extract<HeroSlideBackground, { type: "image" }>): number {
  return banner.positionY ?? banner.positionX ?? 50;
}

function BannerDimensionNotice() {
  return (
    <div className="flex gap-2 rounded-lg border border-blue-500/25 bg-blue-500/5 px-3 py-2.5 text-xs text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium text-foreground">Dimensions recommandées</p>
        <p>
          <strong>{OPPORTUNITY_BANNER_SPECS.formatLabel}</strong> (ratio{" "}
          {OPPORTUNITY_BANNER_SPECS.aspectRatioLabel})
        </p>
        <p>
          Minimum : {OPPORTUNITY_BANNER_SPECS.minFormatLabel}. Format JPG, PNG ou WebP.
        </p>
        <p className="text-[11px] leading-snug">
          Les bords peuvent être rognés sur mobile — placez le sujet principal au centre ou
          ajustez le cadrage vertical ci-dessous.
        </p>
      </div>
    </div>
  );
}

function BannerImageLivePreview({ banner }: { banner: Extract<HeroSlideBackground, { type: "image" }> }) {
  const positionY = imagePositionY(banner);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        Aperçu en direct (même ratio que la page opportunité)
      </Label>
      <div className="relative overflow-hidden rounded-lg border-2 border-border shadow-sm">
        <OpportunityPublicBannerWidthShell>
          <OpportunityPublicBannerFrame banner={banner}>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
            <div
              className="pointer-events-none absolute inset-x-0 h-0.5 bg-white/90 shadow-[0_0_6px_rgba(0,0,0,0.45)]"
              style={{ top: `${positionY}%`, transform: "translateY(-50%)" }}
              aria-hidden
            />
            <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
              Cadrage vertical {positionY}%
            </div>
          </OpportunityPublicBannerFrame>
        </OpportunityPublicBannerWidthShell>
      </div>
    </div>
  );
}

export default function OpportunityBannerEditor({
  value,
  onChange,
  onImageUpload,
  isUploading,
}: OpportunityBannerEditorProps) {
  const setBgType = (type: "solid" | "gradient" | "image") => {
    if (type === "solid") {
      const color = value.type === "gradient" ? value.from : value.type === "solid" ? value.color : "#4f46e5";
      onChange({ type: "solid", color });
    } else if (type === "gradient") {
      const from = value.type === "solid" ? value.color : value.type === "gradient" ? value.from : "#6366f1";
      const to = value.type === "gradient" ? value.to : "#1e1b4b";
      const angleDeg = value.type === "gradient" ? value.angleDeg : 135;
      onChange({ type: "gradient", from, to, angleDeg });
    } else {
      const overlayOpacity = value.type === "image" ? (value.overlayOpacity ?? 35) : 35;
      const positionY = value.type === "image" ? imagePositionY(value) : 50;
      const url = value.type === "image" ? value.url : "";
      onChange({ type: "image", url, overlayOpacity, positionY });
    }
  };

  const patchImage = (patch: Partial<Extract<HeroSlideBackground, { type: "image" }>>) => {
    if (value.type !== "image") return;
    const next = { ...value, ...patch };
    if ("positionY" in patch) {
      delete next.positionX;
    }
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <Label>Bannière</Label>
      <Tabs value={value.type} onValueChange={(v) => setBgType(v as "solid" | "gradient" | "image")}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="solid">Couleur</TabsTrigger>
          <TabsTrigger value="gradient">Dégradé</TabsTrigger>
          <TabsTrigger value="image">Image</TabsTrigger>
        </TabsList>
        <TabsContent value="solid" className="space-y-3 pt-2">
          <div className="flex flex-wrap items-end gap-3">
            <input
              type="color"
              aria-label="Couleur de fond"
              className="h-10 w-14 cursor-pointer rounded-md border border-input"
              value={value.type === "solid" ? value.color : "#4f46e5"}
              onChange={(e) => onChange({ type: "solid", color: e.target.value })}
            />
            <Input
              className="max-w-[10rem]"
              value={value.type === "solid" ? value.color : ""}
              onChange={(e) => onChange({ type: "solid", color: e.target.value })}
              placeholder="#4f46e5"
            />
          </div>
        </TabsContent>
        <TabsContent value="gradient" className="space-y-3 pt-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex gap-2">
              <input
                type="color"
                className="h-10 w-14 shrink-0 cursor-pointer rounded-md border border-input"
                value={value.type === "gradient" ? value.from : "#6366f1"}
                onChange={(e) =>
                  value.type === "gradient" && onChange({ ...value, from: e.target.value })
                }
              />
              <Input
                value={value.type === "gradient" ? value.from : ""}
                onChange={(e) =>
                  value.type === "gradient" && onChange({ ...value, from: e.target.value })
                }
              />
            </div>
            <div className="flex gap-2">
              <input
                type="color"
                className="h-10 w-14 shrink-0 cursor-pointer rounded-md border border-input"
                value={value.type === "gradient" ? value.to : "#312e81"}
                onChange={(e) =>
                  value.type === "gradient" && onChange({ ...value, to: e.target.value })
                }
              />
              <Input
                value={value.type === "gradient" ? value.to : ""}
                onChange={(e) =>
                  value.type === "gradient" && onChange({ ...value, to: e.target.value })
                }
              />
            </div>
          </div>
          {value.type === "gradient" && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Angle ({value.angleDeg}°)</Label>
              <Input
                type="range"
                min={0}
                max={360}
                value={value.angleDeg}
                onChange={(e) => onChange({ ...value, angleDeg: Number(e.target.value) })}
              />
            </div>
          )}
        </TabsContent>
        <TabsContent value="image" className="space-y-3 pt-2">
          <BannerDimensionNotice />
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onImageUpload(file);
            }}
          />
          {value.type === "image" && value.url && (
            <>
              <BannerImageLivePreview banner={value} />
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs text-muted-foreground">Position verticale</Label>
                  <span className="text-xs font-semibold tabular-nums text-foreground">
                    {imagePositionY(value)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={imagePositionY(value)}
                  className="h-2 w-full cursor-pointer accent-primary"
                  aria-label="Position verticale de l'image"
                  onInput={(e) =>
                    patchImage({ positionY: Number((e.target as HTMLInputElement).value) })
                  }
                  onChange={(e) => patchImage({ positionY: Number(e.target.value) })}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Haut</span>
                  <span>Centre</span>
                  <span>Bas</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs text-muted-foreground">Opacité du voile</Label>
                  <span className="text-xs font-semibold tabular-nums text-foreground">
                    {value.overlayOpacity ?? 35}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={value.overlayOpacity ?? 35}
                  className="h-2 w-full cursor-pointer accent-primary"
                  aria-label="Opacité du voile"
                  onInput={(e) =>
                    patchImage({ overlayOpacity: Number((e.target as HTMLInputElement).value) })
                  }
                  onChange={(e) => patchImage({ overlayOpacity: Number(e.target.value) })}
                />
              </div>
              <Input
                value={value.url}
                onChange={(e) => patchImage({ url: e.target.value })}
                placeholder="URL de l'image"
                className="text-xs"
              />
            </>
          )}
          {value.type === "image" && !value.url && (
            <p className="text-xs text-muted-foreground">
              Téléversez une image pour ajuster le cadrage en direct.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
