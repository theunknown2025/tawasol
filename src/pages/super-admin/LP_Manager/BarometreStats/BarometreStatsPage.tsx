import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BarometreDataset } from "./barometreDatasetTypes";
import { NouveauBarometreTab } from "./NouveauBarometreTab";
import { HistoriqueBarometreTab } from "./HistoriqueBarometreTab";

export default function BarometreStatsPage() {
  const [tab, setTab] = useState("nouveau");
  const [editing, setEditing] = useState<BarometreDataset | null>(null);

  const openEdit = (dataset: BarometreDataset) => {
    setEditing(dataset);
    setTab("nouveau");
  };

  const clearEditing = () => setEditing(null);

  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Baromètre</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Créez des tableaux (colonnes et données), choisissez les axes du graphique, enregistrez et
          publiez. Les graphiques publiés apparaissent sur la page publique Baromètre.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value);
          if (value === "liste") clearEditing();
        }}
        className="w-full"
      >
        <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="nouveau">
            {editing ? "Modifier le Baromètre" : "Nouveau Baromètre"}
          </TabsTrigger>
          <TabsTrigger value="liste">Mes Baromètres</TabsTrigger>
        </TabsList>
        <TabsContent value="nouveau" className="mt-0">
          <NouveauBarometreTab
            editing={editing}
            onCancelEdit={clearEditing}
            onSaved={(dataset) => setEditing(dataset)}
          />
        </TabsContent>
        <TabsContent value="liste" className="mt-0">
          <HistoriqueBarometreTab onEdit={openEdit} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
