import { LayoutDashboard } from "lucide-react";

export default function LpDashboardPage() {
  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">
            Vue d’ensemble de la landing Remess et accès rapides.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Éditeur
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">Hero</p>
          <p className="mt-1 text-sm text-muted-foreground">Section disponible dans l’éditeur.</p>
        </div>
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Bibliothèque
          </p>
          <p className="mt-2 text-sm text-muted-foreground">À venir</p>
        </div>
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Statistiques
          </p>
          <p className="mt-2 text-sm text-muted-foreground">À venir</p>
        </div>
      </div>
    </div>
  );
}
