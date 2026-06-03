import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  User,
  LayoutGrid,
  BarChart3,
  FolderKanban,
  Users,
  ClipboardList,
  ListChecks,
  FileText,
  CalendarDays,
  MessageSquare,
  LogOut,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  UserCog,
  Bot,
  Image,
  NotebookPen,
  FileSpreadsheet,
  Mail,
  Phone,
  Briefcase,
  LayoutDashboard,
  PlusCircle,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES, ROLE_LABELS } from "@/lib/supabase";

// Admin nav (admin + super_admin)
const adminMainNav = [
  { label: "Profil", icon: User, path: "/admin/profil" },
  { label: "Mur", icon: LayoutGrid, path: "/admin/mur" },
  { label: "Dashboard", icon: BarChart3, path: "/admin/dashboard" },
];

type ProjetSubItem = {
  label: string;
  icon: typeof Users;
  path: string;
};

const adminProjetsSubBase: ProjetSubItem[] = [
  { label: "Gestion Personnel", icon: Users, path: "/admin/projets/gestion-personnel" },
  { label: "Gestion Projet", icon: ClipboardList, path: "/admin/projets/gestion-projet" },
  { label: "PMO", icon: ListChecks, path: "/admin/projets/pmo" },
];

const murSubItems = [
  { label: "Mur", icon: LayoutGrid, path: "/admin/mur" },
  { label: "Publications", icon: FileText, path: "/admin/publications" },
];

const outilsSubItems = [
  { label: "Gestion Form", icon: FileSpreadsheet, path: "/admin/gestion-form" },
  { label: "Assistant IA", icon: Bot, path: "/admin/assistant-ia" },
  { label: "Media Manager", icon: Image, path: "/admin/media-manager" },
];

const MUR_PATH_PREFIXES = ["/admin/mur", "/admin/publications"];
const OUTILS_PATH_PREFIXES = ["/admin/gestion-form", "/admin/assistant-ia", "/admin/media-manager"];

const adminBottomNavBeforeMessagerie = [
  { label: "Publications", icon: FileText, path: "/admin/publications" },
  { label: "Événements", icon: CalendarDays, path: "/admin/evenements" },
];

const adminBottomNavAfterMessagerie = [
  { label: "Blog", icon: NotebookPen, path: "/admin/blogs" },
  { label: "Gestion Form", icon: FileSpreadsheet, path: "/admin/gestion-form" },
];

const messagerieSubItems = [
  { label: "Messagerie", icon: MessageSquare, path: "/admin/messagerie" },
  { label: "Email (Brevo)", icon: Mail, path: "/admin/whatsapp-manager" },
  { label: "WhatsApp (WAHA)", icon: Phone, path: "/admin/whatsapp-waha" },
];

const opportunitesSubItems = [
  { label: "Tableau de bord", icon: LayoutDashboard, path: "/admin/opportunites/dashboard" },
  { label: "Nouvelle Opportunité", icon: PlusCircle, path: "/admin/opportunites/nouvelle" },
  { label: "Suivi Candidatures", icon: ClipboardList, path: "/admin/opportunites/suivi" },
];

// Super Admin only
const superAdminNav = [
  { label: "Gestion des membres", icon: UserCog, path: "/admin/membres" },
];

// Member nav
const memberNav = [
  { label: "Mur", icon: LayoutGrid, path: "/member/mur" },
  { label: "Dashboard", icon: BarChart3, path: "/member/dashboard" },
  { label: "Profil", icon: User, path: "/member/profil" },
];

export default function AppSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { profile, signOut } = useAuth();

  const isAdmin = pathname.startsWith("/admin");
  const isMember = pathname.startsWith("/member");
  const role = profile?.role;
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;

  const isMurSectionActive = MUR_PATH_PREFIXES.some((p) => pathname.startsWith(p));
  const isOutilsSectionActive = OUTILS_PATH_PREFIXES.some((p) => pathname.startsWith(p));

  const [collapsed, setCollapsed] = useState(false);
  const [projetsOpen, setProjetsOpen] = useState(true);
  const [murOpen, setMurOpen] = useState(true);
  const [outilsOpen, setOutilsOpen] = useState(true);
  const [messagerieOpen, setMessagerieOpen] = useState(true);
  const [opportunitesOpen, setOpportunitesOpen] = useState(true);

  const adminMainNavItems = isSuperAdmin
    ? adminMainNav.filter((item) => item.path !== "/admin/mur")
    : adminMainNav;

  const bottomNavBeforeMessagerie = isSuperAdmin
    ? adminBottomNavBeforeMessagerie.filter((item) => item.path !== "/admin/publications")
    : adminBottomNavBeforeMessagerie;

  const bottomNavAfterMessagerie = isSuperAdmin
    ? adminBottomNavAfterMessagerie.filter((item) => item.path !== "/admin/gestion-form")
    : adminBottomNavAfterMessagerie;

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-fg))] shadow-md shadow-[hsl(var(--sidebar-active)/0.25)]"
        : "text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover))]"
    }`;

  const handleLogout = () => {
    void (async () => {
      try {
        await signOut();
      } catch (e) {
        console.error(e);
      } finally {
        navigate("/auth", { replace: true });
      }
    })();
  };

  return (
    <aside
      className={`relative z-30 flex flex-col h-screen sticky top-0 bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))] transition-all duration-300 shrink-0 ${
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

      {/* Role badge */}
      {!collapsed && profile && role && (
        <div className="px-4 py-2 border-b border-[hsl(var(--sidebar-border))]">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {ROLE_LABELS[role]}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* Admin nav (admin + super_admin) */}
        {(isAdmin || (!isAdmin && !isMember)) && (
          <>
            {adminMainNavItems.map((item) => (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive)}>
                <item.icon size={20} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}

            {isSuperAdmin && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setMurOpen(!murOpen)}
                  className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium transition-all duration-200 ${
                    isMurSectionActive
                      ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-fg))] shadow-md shadow-[hsl(var(--sidebar-active)/0.25)]"
                      : "text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover))]"
                  }`}
                >
                  <LayoutGrid size={20} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">MUR</span>
                      {murOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </>
                  )}
                </button>
                {murOpen && !collapsed && (
                  <div className="ml-4 pl-3 border-l border-[hsl(var(--sidebar-border))] space-y-1 mt-1">
                    {murSubItems.map((item) => (
                      <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive)}>
                        <item.icon size={18} className="shrink-0" />
                        <span className="text-sm">{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isSuperAdmin && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setOutilsOpen(!outilsOpen)}
                  className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium transition-all duration-200 ${
                    isOutilsSectionActive
                      ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-fg))] shadow-md shadow-[hsl(var(--sidebar-active)/0.25)]"
                      : "text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover))]"
                  }`}
                >
                  <Wrench size={20} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">Outils</span>
                      {outilsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </>
                  )}
                </button>
                {outilsOpen && !collapsed && (
                  <div className="ml-4 pl-3 border-l border-[hsl(var(--sidebar-border))] space-y-1 mt-1">
                    {outilsSubItems.map((item) => (
                      <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive)}>
                        <item.icon size={18} className="shrink-0" />
                        <span className="text-sm">{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                  {adminProjetsSubBase.map((item) => (
                    <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive)}>
                      <item.icon size={18} className="shrink-0" />
                      <span className="text-sm">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 space-y-1">
              {bottomNavBeforeMessagerie.map((item) => (
                <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive)}>
                  <item.icon size={20} className="shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
              {isSuperAdmin ? (
                <div className="pt-0">
                  <button
                    type="button"
                    onClick={() => setMessagerieOpen(!messagerieOpen)}
                    className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium transition-all duration-200 ${
                      pathname.startsWith("/admin/messagerie") ||
                      pathname.startsWith("/admin/whatsapp-manager") ||
                      pathname.startsWith("/admin/whatsapp-waha")
                        ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-fg))] shadow-md shadow-[hsl(var(--sidebar-active)/0.25)]"
                        : "text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover))]"
                    }`}
                  >
                    <MessageSquare size={20} className="shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">Messagerie</span>
                        {messagerieOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </>
                    )}
                  </button>
                  {messagerieOpen && !collapsed && (
                    <div className="ml-4 pl-3 border-l border-[hsl(var(--sidebar-border))] space-y-1 mt-1">
                      {messagerieSubItems.map((item) => (
                        <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive)}>
                          <item.icon size={18} className="shrink-0" />
                          <span className="text-sm">{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink to="/admin/messagerie" className={({ isActive }) => linkClass(isActive)}>
                  <MessageSquare size={20} className="shrink-0" />
                  {!collapsed && <span>Messagerie</span>}
                </NavLink>
              )}
              {bottomNavAfterMessagerie.map((item) => (
                <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive)}>
                  <item.icon size={20} className="shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
              {isSuperAdmin && (
                <>
                  <NavLink to="/admin/users" className={({ isActive }) => linkClass(isActive)}>
                    <Users size={20} className="shrink-0" />
                    {!collapsed && <span>Utilisateurs</span>}
                  </NavLink>
                  <div className="pt-0">
                    <button
                      type="button"
                      onClick={() => setOpportunitesOpen(!opportunitesOpen)}
                      className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium transition-all duration-200 ${
                        pathname.startsWith("/admin/opportunites")
                          ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-fg))] shadow-md shadow-[hsl(var(--sidebar-active)/0.25)]"
                          : "text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover))]"
                      }`}
                    >
                      <Briefcase size={20} className="shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">Opportunités Manager</span>
                          {opportunitesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </>
                      )}
                    </button>
                    {opportunitesOpen && !collapsed && (
                      <div className="ml-4 pl-3 border-l border-[hsl(var(--sidebar-border))] space-y-1 mt-1">
                        {opportunitesSubItems.map((item) => (
                          <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive)}>
                            <item.icon size={18} className="shrink-0" />
                            <span className="text-sm">{item.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                  {superAdminNav.map((item) => (
                    <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive)}>
                      <item.icon size={20} className="shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  ))}
                </>
              )}
            </div>
          </>
        )}

        {/* Member nav */}
        {isMember && (
          <div className="space-y-1">
            {memberNav.map((item) => (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive)}>
                <item.icon size={20} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-[hsl(var(--sidebar-border))]">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
