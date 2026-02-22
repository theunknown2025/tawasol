import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  User,
  LayoutGrid,
  BarChart3,
  FolderKanban,
  Users,
  ClipboardList,
  FileText,
  CalendarDays,
  MessageSquare,
  LogOut,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

const mainNav = [
  { label: "Profil", icon: User, path: "/profil" },
  { label: "Mur", icon: LayoutGrid, path: "/mur" },
  { label: "Dashboard", icon: BarChart3, path: "/dashboard" },
];

const projetsSub = [
  { label: "Gestion Personnel", icon: Users, path: "/projets/gestion-personnel" },
  { label: "Gestion Projet", icon: ClipboardList, path: "/projets/gestion-projet" },
];

const bottomNav = [
  { label: "Publications", icon: FileText, path: "/publications" },
  { label: "Événements", icon: CalendarDays, path: "/evenements" },
  { label: "Messagerie", icon: MessageSquare, path: "/messagerie" },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [projetsOpen, setProjetsOpen] = useState(true);
  const navigate = useNavigate();

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-fg))] shadow-md shadow-[hsl(var(--sidebar-active)/0.25)]"
        : "text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover))]"
    }`;

  return (
    <aside
      className={`flex flex-col h-screen sticky top-0 bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))] transition-all duration-300 shrink-0 ${
        collapsed ? "w-[4.5rem]" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-[hsl(var(--sidebar-border))]">
        {!collapsed && (
          <span className="text-lg font-bold text-[hsl(var(--sidebar-active))]">
            ProManager
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover))] transition-colors"
        >
          {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {mainNav.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive)}>
            <item.icon size={20} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        {/* Projets group */}
        <div className="pt-2">
          <button
            onClick={() => setProjetsOpen(!projetsOpen)}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover))] transition-colors"
          >
            <FolderKanban size={20} className="shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Projets</span>
                {projetsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </>
            )}
          </button>
          {projetsOpen && !collapsed && (
            <div className="ml-4 pl-3 border-l border-[hsl(var(--sidebar-border))] space-y-1 mt-1">
              {projetsSub.map((item) => (
                <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive)}>
                  <item.icon size={18} className="shrink-0" />
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 space-y-1">
          {bottomNav.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive)}>
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-[hsl(var(--sidebar-border))]">
        <button
          onClick={() => navigate("/auth")}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
