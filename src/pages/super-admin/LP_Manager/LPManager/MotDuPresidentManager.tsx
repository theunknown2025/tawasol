import { useId, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { uploadLandingPageImage } from "@/lib/lpLandingPageApi";
import {
  MOT_DU_PRESIDENT_SIGNATURE_FONTS,
  MOT_DU_PRESIDENT_SIGNATURE_SIZES,
  resolveMotDuPresidentSignatureFont,
  type MotDuPresidentContent,
  type MotDuPresidentSignatureFontId,
  type MotDuPresidentSignatureSizeId,
  type TextDirection,
} from "../types";

type MotDuPresidentManagerProps = {
  value: MotDuPresidentContent;
  onChange: (next: MotDuPresidentContent) => void;
};

function DirectionToggle({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: TextDirection;
  onChange: (next: TextDirection) => void;
}) {
  return (
    <div className="space-y-2">
      <Label id={id}>{label}</Label>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={value}
        aria-labelledby={id}
        className="justify-start"
        onValueChange={(next) => {
          if (next === "ltr" || next === "rtl") onChange(next);
        }}
      >
        <ToggleGroupItem value="ltr" aria-label="Gauche à droite" className="px-3">
          LTR
        </ToggleGroupItem>
        <ToggleGroupItem value="rtl" aria-label="Droite à gauche" className="px-3">
          RTL
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

export function MotDuPresidentManager({ value, onChange }: MotDuPresidentManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const urlFieldId = useId();
  const messageDirId = useId();
  const signatureDirId = useId();
  const signatureFont = resolveMotDuPresidentSignatureFont(value.signatureFont);

  const patch = (partial: Partial<MotDuPresidentContent>) => {
    onChange({ ...value, ...partial });
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url, usedFallback } = await uploadLandingPageImage(file, "mot-du-president");
      patch({ presidentImageUrl: url });
      if (usedFallback) {
        toast.warning("Image enregistrée en local", {
          description:
            "Le stockage distant n’est pas disponible : l’image est intégrée pour cette session.",
        });
      } else {
        toast.success("Photo téléversée");
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
        <Label>Photo du président</Label>
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
            {uploading ? "Téléversement…" : "Choisir une image"}
          </Button>
          {value.presidentImageUrl.trim().length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => patch({ presidentImageUrl: "" })}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Retirer la photo
            </Button>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={urlFieldId} className="text-xs text-muted-foreground">
            Ou URL de l’image
          </Label>
          <Input
            id={urlFieldId}
            value={value.presidentImageUrl}
            onChange={(e) => patch({ presidentImageUrl: e.target.value })}
            placeholder="https://…"
          />
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mdp-name">Nom</Label>
          <Input
            id="mdp-name"
            value={value.presidentName}
            onChange={(e) => patch({ presidentName: e.target.value })}
            placeholder="Prénom Nom"
            dir={value.messageDirection}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mdp-position">Fonction</Label>
          <Input
            id="mdp-position"
            value={value.position}
            onChange={(e) => patch({ position: e.target.value })}
            placeholder="ex. Président du REMESS"
            dir={value.messageDirection}
          />
        </div>
      </div>

      <DirectionToggle
        id={messageDirId}
        label="Direction du texte"
        value={value.messageDirection}
        onChange={(messageDirection) => patch({ messageDirection })}
      />

      <div className="space-y-2">
        <Label htmlFor="mdp-message">Texte du mot</Label>
        <Textarea
          id="mdp-message"
          value={value.messageText}
          onChange={(e) => patch({ messageText: e.target.value })}
          placeholder="Votre message aux membres et partenaires…"
          rows={8}
          dir={value.messageDirection}
          className="min-h-[12rem] resize-y"
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mdp-signature">Signature</Label>
          <Input
            id="mdp-signature"
            value={value.signature}
            onChange={(e) => patch({ signature: e.target.value })}
            placeholder="ex. Jean Dupont"
            dir={value.signatureDirection}
            style={{ fontFamily: signatureFont.family, fontSize: "1.35rem" }}
          />
        </div>

        <DirectionToggle
          id={signatureDirId}
          label="Direction de la signature"
          value={value.signatureDirection}
          onChange={(signatureDirection) => patch({ signatureDirection })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mdp-signature-font">Police de la signature</Label>
            <Select
              value={value.signatureFont}
              onValueChange={(next) =>
                patch({ signatureFont: next as MotDuPresidentSignatureFontId })
              }
            >
              <SelectTrigger id="mdp-signature-font">
                <SelectValue placeholder="Choisir une police" />
              </SelectTrigger>
              <SelectContent>
                {MOT_DU_PRESIDENT_SIGNATURE_FONTS.map((font) => (
                  <SelectItem key={font.id} value={font.id}>
                    <span
                      className="inline-flex items-baseline gap-2"
                      style={{ fontFamily: font.family }}
                      dir={font.script === "arabic" ? "rtl" : "ltr"}
                    >
                      <span>{font.label}</span>
                      {font.script === "arabic" && (
                        <span className="text-muted-foreground" aria-hidden>
                          توقيع
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mdp-signature-size">Taille de la signature</Label>
            <Select
              value={value.signatureSize}
              onValueChange={(next) =>
                patch({ signatureSize: next as MotDuPresidentSignatureSizeId })
              }
            >
              <SelectTrigger id="mdp-signature-size">
                <SelectValue placeholder="Choisir une taille" />
              </SelectTrigger>
              <SelectContent>
                {MOT_DU_PRESIDENT_SIGNATURE_SIZES.map((size) => (
                  <SelectItem key={size.id} value={size.id}>
                    {size.label} ({size.px}px)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
