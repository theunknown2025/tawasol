import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NouveauBarometreTab } from "./NouveauBarometreTab";
import { HistoriqueBarometreTab } from "./HistoriqueBarometreTab";

export default function BarometreStatsPage() {
  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Baromètre</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Importez les statistiques nationales (coopératives et adhérents) par région et par secteur depuis un
          fichier Excel, puis consultez l’historique par année. Les graphiques coopératives et adhérents sont
          toujours affichés séparément.
        </p>
      </div>

      <Tabs defaultValue="nouveau" className="w-full">
        <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="nouveau">Nouveau Baromètre</TabsTrigger>
          <TabsTrigger value="historique">Historique Baromètre</TabsTrigger>
        </TabsList>
        <TabsContent value="nouveau" className="mt-0">
          <NouveauBarometreTab />
        </TabsContent>
        <TabsContent value="historique" className="mt-0">
          <HistoriqueBarometreTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
