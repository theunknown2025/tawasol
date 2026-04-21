import { NavLink, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LayoutDashboard,
  LayoutTemplate,
  Library,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS, ROLES } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const LP_BASE = "/admin/remess-landing";

const lpNav = [
  { label: "Profil", icon: User, path: `${LP_BASE}/profile`, end: true },
  { label: "Éditeur", icon: LayoutTemplate, path: `${LP_BASE}/editor`, end: false },
  { label: "Bibliothèque", icon: Library, path: `${LP_BASE}/library`, end: true },
  { label: "Tableau de bord", icon: LayoutDashboard, path: `${LP_BASE}/dashboard`, end: true },
] as const;

export default function LpManagerSidebar() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const linkClass = (isActive: boolean) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      isActive
        ? "bg-violet-600/15 text-violet-700 dark:text-violet-300 shadow-sm ring-1 ring-violet-500/20"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

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
    <aside className="sticky top-0 z-30 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-gradient-to-b from-violet-950/[0.07] via-background to-background dark:from-violet-950/25">
      <div className="flex h-16 items-center border-b border-border px-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            Remess
          </p>
          <p className="truncate text-sm font-bold text-foreground">Landing Page</p>
        </div>
      </div>

      {profile?.role === ROLES.SUPER_ADMIN && (
        <div className="border-b border-border px-4 py-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {ROLE_LABELS[profile.role]}
          </span>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          LP Manager
        </p>
        {lpNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => linkClass(isActive)}
          >
            <item.icon size={20} className="shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-border px-3 py-4">
        <button
          type="button"
          onClick={() => navigate("/admin/portail")}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft size={20} className="shrink-0" />
          <span>Portail super admin</span>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
        >
          <LogOut size={20} className="shrink-0" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
