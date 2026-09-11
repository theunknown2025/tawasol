import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NouveauBarometreTab } from "./NouveauBarometreTab";
import { HistoriqueBarometreTab } from "./HistoriqueBarometreTab";

export default function BarometreStatsPage() {
  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Baromètre</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Créez des tableaux (colonnes et données), choisissez les axes du graphique, enregistrez et
          publiez. Les graphiques publiés apparaissent sur la page publique Baromètre.
        </p>
      </div>

      <Tabs defaultValue="nouveau" className="w-full">
        <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="nouveau">Nouveau Baromètre</TabsTrigger>
          <TabsTrigger value="liste">Mes Baromètres</TabsTrigger>
        </TabsList>
        <TabsContent value="nouveau" className="mt-0">
          <NouveauBarometreTab />
        </TabsContent>
        <TabsContent value="liste" className="mt-0">
          <HistoriqueBarometreTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
