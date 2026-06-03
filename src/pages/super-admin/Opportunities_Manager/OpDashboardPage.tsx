import { Link } from "react-router-dom";
import { Briefcase, ClipboardList, PlusCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchMyOpportunities } from "@/lib/opportunitiesApi";

const OP_BASE = "/admin/opportunites";

export default function OpDashboardPage() {
  const { data: opportunities = [] } = useQuery({
    queryKey: ["opportunities", "admin"],
    queryFn: fetchMyOpportunities,
  });

  const published = opportunities.filter((o) => o.status === "published").length;
  const drafts = opportunities.filter((o) => o.status === "draft").length;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez les opportunités et le suivi des candidatures.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="mt-1 text-3xl font-bold">{opportunities.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Publiées</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">{published}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Brouillons</p>
          <p className="mt-1 text-3xl font-bold">{drafts}</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          to={`${OP_BASE}/nouvelle`}
          className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-emerald-500/40 hover:shadow-md"
        >
          <PlusCircle className="h-10 w-10 text-emerald-600 transition group-hover:scale-105" />
          <div>
            <h2 className="text-lg font-semibold">Nouvelle Opportunité</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Créer ou modifier une opportunité et consulter la liste.
            </p>
          </div>
        </Link>
        <Link
          to={`${OP_BASE}/suivi`}
          className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-emerald-500/40 hover:shadow-md"
        >
          <ClipboardList className="h-10 w-10 text-emerald-600 transition group-hover:scale-105" />
          <div>
            <h2 className="text-lg font-semibold">Suivi Candidatures</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Examiner les candidatures et exporter les résultats en Excel.
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Briefcase size={16} />
        <span>Les opportunités publiées apparaissent sur la page d&apos;accueil et sur /opportunites.</span>
      </div>
    </div>
  );
}
