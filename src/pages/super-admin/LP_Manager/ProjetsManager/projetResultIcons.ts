import type { LucideIcon } from "lucide-react";
import {
  Award,
  Compass,
  Globe2,
  Handshake,
  Heart,
  Leaf,
  Lightbulb,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import type { AProposValeurIconKey } from "@/pages/super-admin/LP_Manager/types";
import { A_PROPOS_VALEUR_ICON_KEYS, isAProposValeurIconKey } from "@/pages/super-admin/LP_Manager/types";

export const LP_PROJET_RESULT_ICONS: Record<AProposValeurIconKey, LucideIcon> = {
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

export { A_PROPOS_VALEUR_ICON_KEYS, isAProposValeurIconKey };

export function resolveProjetResultIcon(iconKey: string): LucideIcon {
  const key = isAProposValeurIconKey(iconKey) ? iconKey : A_PROPOS_VALEUR_ICON_KEYS[0];
  return LP_PROJET_RESULT_ICONS[key];
}
