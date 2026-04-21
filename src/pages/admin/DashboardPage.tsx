import { BarChart3, Users, FolderKanban, CalendarDays } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/supabase";
import SuperAdminDashboardPage from "../super-admin/SuperAdminDashboardPage";

const stats = [
  { label: "Projets actifs", value: "12", icon: FolderKanban, color: "bg-primary/10 text-primary" },
  { label: "Membres", value: "34", icon: Users, color: "bg-blue-500/10 text-blue-500" },
  { label: "Tâches en cours", value: "58", icon: BarChart3, color: "bg-amber-500/10 text-amber-500" },
  { label: "Événements", value: "7", icon: CalendarDays, color: "bg-rose-500/10 text-rose-500" },
];

export default function DashboardPage() {
  const { profile } = useAuth();

  if (profile?.role === ROLES.SUPER_ADMIN) {
    // Super admin sees the global, full-visibility dashboard
    return <SuperAdminDashboardPage />;
  }

  // Admins keep the classic admin dashboard view
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-primary/10">
          <BarChart3 className="text-primary" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className={`inline-flex p-2.5 rounded-xl ${s.color} mb-4`}>
              <s.icon size={22} />
            </div>
            <p className="text-3xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm h-64">
          <h3 className="font-semibold text-foreground mb-4">Activité récente</h3>
          <p className="text-muted-foreground text-sm">Les données apparaîtront ici.</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm h-64">
          <h3 className="font-semibold text-foreground mb-4">Projets en cours</h3>
          <p className="text-muted-foreground text-sm">Les données apparaîtront ici.</p>
        </div>
      </div>
    </div>
  );
}
