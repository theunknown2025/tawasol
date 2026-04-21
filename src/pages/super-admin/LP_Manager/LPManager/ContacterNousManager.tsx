import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseLatLngFromGoogleMapsUrl } from "@/lib/googleMapsCoords";
import type { ContacterNousContent } from "../types";

type ContacterNousManagerProps = {
  value: ContacterNousContent;
  onChange: (next: ContacterNousContent) => void;
};

export function ContacterNousManager({ value, onChange }: ContacterNousManagerProps) {
  const patch = (partial: Partial<ContacterNousContent>) => {
    onChange({ ...value, ...partial });
  };

  const extractCoords = () => {
    const parsed = parseLatLngFromGoogleMapsUrl(value.googleMapsUrl);
    if (!parsed) {
      toast.error("Coordonnées introuvables", {
        description:
          "Utilisez un lien « Partager » de Google Maps (avec @latitude,longitude dans l’URL), ou renseignez latitude / longitude manuellement.",
      });
      return;
    }
    patch({ latitude: parsed.lat, longitude: parsed.lng });
    toast.success("Coordonnées extraites", {
      description: `${parsed.lat.toFixed(5)}, ${parsed.lng.toFixed(5)}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="cn-address">Adresse</Label>
        <Textarea
          id="cn-address"
          value={value.address}
          onChange={(e) => patch({ address: e.target.value })}
          placeholder="Adresse postale complète…"
          rows={4}
          className="min-h-[5rem] resize-y"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cn-phone">Téléphone</Label>
          <Input
            id="cn-phone"
            value={value.phone}
            onChange={(e) => patch({ phone: e.target.value })}
            placeholder="+212 …"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cn-wa">WhatsApp (numéro)</Label>
          <Input
            id="cn-wa"
            value={value.whatsapp}
            onChange={(e) => patch({ whatsapp: e.target.value })}
            placeholder="Même format qu’un numéro mobile"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cn-email">E-mail</Label>
        <Input
          id="cn-email"
          type="email"
          value={value.email}
          onChange={(e) => patch({ email: e.target.value })}
          placeholder="contact@…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cn-maps">URL Google Maps</Label>
        <Input
          id="cn-maps"
          value={value.googleMapsUrl}
          onChange={(e) => patch({ googleMapsUrl: e.target.value })}
          placeholder="https://www.google.com/maps/…"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={extractCoords}>
            <MapPin className="mr-2 h-4 w-4" aria-hidden />
            Extraire les coordonnées depuis l’URL
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cn-lat">Latitude (optionnel)</Label>
          <Input
            id="cn-lat"
            inputMode="decimal"
            value={value.latitude != null && Number.isFinite(value.latitude) ? String(value.latitude) : ""}
            onChange={(e) => {
              const v = e.target.value.trim();
              if (v === "") patch({ latitude: null });
              else {
                const n = Number(v);
                patch({ latitude: Number.isFinite(n) ? n : null });
              }
            }}
            placeholder="ex. 33.5731"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cn-lng">Longitude (optionnel)</Label>
          <Input
            id="cn-lng"
            inputMode="decimal"
            value={
              value.longitude != null && Number.isFinite(value.longitude) ? String(value.longitude) : ""
            }
            onChange={(e) => {
              const v = e.target.value.trim();
              if (v === "") patch({ longitude: null });
              else {
                const n = Number(v);
                patch({ longitude: Number.isFinite(n) ? n : null });
              }
            }}
            placeholder="ex. -7.5898"
          />
        </div>
      </div>
    </div>
  );
}
