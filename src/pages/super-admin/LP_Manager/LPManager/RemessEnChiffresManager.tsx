import {
  Award,
  Compass,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  A_PROPOS_VALEUR_ICON_KEYS,
  createDefaultRemessChiffreStat,
  ensureRemessChiffresStatsCount,
  REMESS_CHIFFRES_STATS_MAX,
  REMESS_CHIFFRES_STATS_MIN,
  type AProposValeurIconKey,
  type RemessEnChiffreStatItem,
  type RemessEnChiffresContent,
} from "../types";

const STAT_ICONS: Record<AProposValeurIconKey, LucideIcon> = {
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

type RemessEnChiffresManagerProps = {
  value: RemessEnChiffresContent;
  onChange: (next: RemessEnChiffresContent) => void;
};

export function RemessEnChiffresManager({ value, onChange }: RemessEnChiffresManagerProps) {
  const patch = (partial: Partial<RemessEnChiffresContent>) => {
    const next: RemessEnChiffresContent = { ...value, ...partial };
    if (partial.stats !== undefined) {
      next.stats = ensureRemessChiffresStatsCount(partial.stats);
    }
    onChange(next);
  };

  const patchStat = (id: string, partial: Partial<RemessEnChiffreStatItem>) => {
    patch({
      stats: value.stats.map((s) => (s.id === id ? { ...s, ...partial } : s)),
    });
  };

  const addStat = () => {
    if (value.stats.length >= REMESS_CHIFFRES_STATS_MAX) return;
    patch({
      stats: ensureRemessChiffresStatsCount([
        ...value.stats,
        createDefaultRemessChiffreStat(value.stats.length),
      ]),
    });
  };

  const removeStat = (id: string) => {
    if (value.stats.length <= REMESS_CHIFFRES_STATS_MIN) return;
    patch({ stats: value.stats.filter((s) => s.id !== id) });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="rec-subtitle">Sous-titre</Label>
        <Textarea
          id="rec-subtitle"
          value={value.subtitle}
          onChange={(e) => patch({ subtitle: e.target.value })}
          rows={3}
          placeholder="Phrase d’introduction sous le titre « REMESS en chiffres »…"
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Indicateurs</h3>
            <p className="text-xs text-muted-foreground">
              Chiffre affiché, titre, description et icône — entre {REMESS_CHIFFRES_STATS_MIN} et{" "}
              {REMESS_CHIFFRES_STATS_MAX} blocs.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1.5"
            disabled={value.stats.length >= REMESS_CHIFFRES_STATS_MAX}
            onClick={addStat}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Ajouter
          </Button>
        </div>

        <div className="space-y-4">
          {value.stats.map((s, index) => (
            <div
              key={s.id}
              className="space-y-3 rounded-xl border border-border bg-background p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Chiffre {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={value.stats.length <= REMESS_CHIFFRES_STATS_MIN}
                  title={
                    value.stats.length <= REMESS_CHIFFRES_STATS_MIN
                      ? `Minimum ${REMESS_CHIFFRES_STATS_MIN} indicateurs`
                      : "Retirer cet indicateur"
                  }
                  onClick={() => removeStat(s.id)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`rec-num-${s.id}`}>Nombre (affichage)</Label>
                <Input
                  id={`rec-num-${s.id}`}
                  value={s.numberValue}
                  onChange={(e) => patchStat(s.id, { numberValue: e.target.value })}
                  placeholder="ex. 120+, 98 %"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`rec-title-${s.id}`}>Titre du chiffre</Label>
                <Input
                  id={`rec-title-${s.id}`}
                  value={s.title}
                  onChange={(e) => patchStat(s.id, { title: e.target.value })}
                  placeholder="ex. Membres actifs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`rec-desc-${s.id}`}>Description</Label>
                <Textarea
                  id={`rec-desc-${s.id}`}
                  value={s.description}
                  onChange={(e) => patchStat(s.id, { description: e.target.value })}
                  rows={2}
                  placeholder="Expliquez ce que mesure ce chiffre…"
                />
              </div>

              <div className="space-y-2">
                <Label>Icône</Label>
                <Select
                  value={s.iconKey}
                  onValueChange={(key) => patchStat(s.id, { iconKey: key as AProposValeurIconKey })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une icône" />
                  </SelectTrigger>
                  <SelectContent>
                    {A_PROPOS_VALEUR_ICON_KEYS.map((key) => {
                      const Icon = STAT_ICONS[key];
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
          ))}
        </div>
      </div>
    </div>
  );
}
