import { NavLink } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  LayoutTemplate,
  Mail,
  Newspaper,
  PanelBottom,
  PanelTop,
  Quote,
  Users,
  UserSquare2,
  Handshake,
  Info,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EDITOR_BASE = "/admin/remess-landing/editor";

type SectionItem = { id: string; label: string; icon: LucideIcon; to: string };

const sections: SectionItem[] = [
  { id: "header", label: "Header", icon: PanelTop, to: `${EDITOR_BASE}/header` },
  { id: "hero", label: "Hero", icon: LayoutTemplate, to: `${EDITOR_BASE}/hero` },
  {
    id: "mot-du-president",
    label: "Mot du président",
    icon: Quote,
    to: `${EDITOR_BASE}/mot-du-president`,
  },
  {
    id: "a-propos-du-remess",
    label: "À propos du REMESS",
    icon: Info,
    to: `${EDITOR_BASE}/a-propos-du-remess`,
  },
  {
    id: "remess-en-chiffres",
    label: "REMESS en chiffres",
    icon: BarChart3,
    to: `${EDITOR_BASE}/remess-en-chiffres`,
  },
  {
    id: "equipe-remess",
    label: "Équipe REMESS",
    icon: Users,
    to: `${EDITOR_BASE}/equipe-remess`,
  },
  { id: "nos-membres", label: "Nos membres", icon: UserSquare2, to: `${EDITOR_BASE}/nos-membres` },
  {
    id: "nos-partenaires",
    label: "Nos partenaires",
    icon: Handshake,
    to: `${EDITOR_BASE}/nos-partenaires`,
  },
  {
    id: "nos-evenements",
    label: "Nos événements",
    icon: CalendarDays,
    to: `${EDITOR_BASE}/nos-evenements`,
  },
  { id: "articles", label: "Articles", icon: Newspaper, to: `${EDITOR_BASE}/articles` },
  {
    id: "contacter-nous",
    label: "Contacter nous",
    icon: Mail,
    to: `${EDITOR_BASE}/contacter-nous`,
  },
  { id: "footer", label: "Footer", icon: PanelBottom, to: `${EDITOR_BASE}/footer` },
];

export default function LpEditorSectionsSidebar() {
  const linkClass = (isActive: boolean) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      isActive
        ? "bg-primary/12 text-primary shadow-sm ring-1 ring-primary/20"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  return (
    <aside className="sticky top-0 z-20 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-muted/20">
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sections
        </p>
        <p className="text-sm font-medium text-foreground">Éditeur</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {sections.map((item) => (
          <NavLink key={item.id} to={item.to} className={({ isActive }) => linkClass(isActive)}>
            <item.icon size={18} className="shrink-0" />
            <span className="leading-snug">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
