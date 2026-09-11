import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LANDING_PAGE_SECTION_LABELS } from "../LandingPage/landingPageSectionLabels";
import {
  createDefaultSectionVisibility,
  type LandingSectionVisibilityMap,
} from "@/lib/lpLandingSectionVisibility";

type SectionVisibilityManagerProps = {
  value: LandingSectionVisibilityMap;
  onChange: (next: LandingSectionVisibilityMap) => void | Promise<void>;
  disabled?: boolean;
};

export function SectionVisibilityManager({
  value,
  onChange,
  disabled = false,
}: SectionVisibilityManagerProps) {
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const visibility = {
    ...createDefaultSectionVisibility(),
    ...value,
  };

  const patch = async (
    label: (typeof LANDING_PAGE_SECTION_LABELS)[number],
    checked: boolean,
  ) => {
    const next = {
      ...createDefaultSectionVisibility(),
      ...value,
      [label]: checked,
    };
    setPendingLabel(label);
    try {
      await onChange(next);
    } finally {
      setPendingLabel(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Chaque interrupteur contrôle l’affichage sur la page d’accueil et dans le menu Accueil.
        Activé = visible ; désactivé = masqué. Les changements sont enregistrés immédiatement.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {LANDING_PAGE_SECTION_LABELS.map((section) => {
          const sid = `lp-vis-${section.replace(/\s+/g, "-").replace(/'/g, "")}`;
          const busy = pendingLabel === section;
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
                checked={visibility[section]}
                disabled={disabled || busy || pendingLabel !== null}
                onCheckedChange={(c) => void patch(section, c)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
