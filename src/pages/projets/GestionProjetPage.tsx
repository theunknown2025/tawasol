import { ClipboardList } from "lucide-react";

export default function GestionProjetPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-primary/10">
          <ClipboardList className="text-primary" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Gestion Projet</h1>
      </div>
      <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
        <p className="text-muted-foreground">Gérez vos projets et leurs détails ici.</p>
      </div>
    </div>
  );
}
