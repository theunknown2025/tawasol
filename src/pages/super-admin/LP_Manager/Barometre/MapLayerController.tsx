import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BoundaryFeature, BoundaryFeatureProperties } from "./useAdminBoundaries";

type FeatureOption = Pick<BoundaryFeatureProperties, "id" | "name">;

type Props = {
  regions: BoundaryFeature[];
  provinces: BoundaryFeature[];
  communes: BoundaryFeature[];
  selectedRegionId: string | null;
  selectedProvinceId: string | null;
  selectedCommuneId: string | null;
  onRegionChange: (id: string | null) => void;
  onProvinceChange: (id: string | null) => void;
  onCommuneChange: (id: string | null) => void;
};

function toOptions(features: BoundaryFeature[]): FeatureOption[] {
  return features.map((feature) => ({
    id: feature.properties.id,
    name: feature.properties.name,
  }));
}

export default function MapLayerController({
  regions,
  provinces,
  communes,
  selectedRegionId,
  selectedProvinceId,
  selectedCommuneId,
  onRegionChange,
  onProvinceChange,
  onCommuneChange,
}: Props) {
  const regionOptions = toOptions(regions);
  const provinceOptions = toOptions(provinces);
  const communeOptions = toOptions(communes);

  return (
    <div className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-sm md:grid-cols-4">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Niveau 1</p>
        <Select value={selectedRegionId ?? ""} onValueChange={(value) => onRegionChange(value || null)}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir une région" />
          </SelectTrigger>
          <SelectContent>
            {regionOptions.map((region) => (
              <SelectItem key={region.id} value={region.id}>
                {region.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Niveau 2</p>
        <Select
          value={selectedProvinceId ?? ""}
          onValueChange={(value) => onProvinceChange(value || null)}
          disabled={!selectedRegionId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir une province" />
          </SelectTrigger>
          <SelectContent>
            {provinceOptions.map((province) => (
              <SelectItem key={province.id} value={province.id}>
                {province.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Niveau 3</p>
        <Select
          value={selectedCommuneId ?? ""}
          onValueChange={(value) => onCommuneChange(value || null)}
          disabled={!selectedProvinceId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir une commune" />
          </SelectTrigger>
          <SelectContent>
            {communeOptions.map((commune) => (
              <SelectItem key={commune.id} value={commune.id}>
                {commune.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            onRegionChange(null);
            onProvinceChange(null);
            onCommuneChange(null);
          }}
        >
          Réinitialiser la sélection
        </Button>
      </div>
    </div>
  );
}
