import { Users, UserPlus, List } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreerUtilisateurTab } from "./users/CreerUtilisateurTab";
import { ListeUtilisateursTab } from "./users/ListeUtilisateursTab";

export default function SuperAdminUsersPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-amber-500/10">
          <Users className="text-amber-600" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Gestion des utilisateurs</h1>
      </div>

      <Tabs defaultValue="liste">
        <TabsList className="mb-6">
          <TabsTrigger value="liste" className="gap-2">
            <List size={18} />
            Liste des utilisateurs
          </TabsTrigger>
          <TabsTrigger value="creer" className="gap-2">
            <UserPlus size={18} />
            Créer un utilisateur
          </TabsTrigger>
        </TabsList>
        <TabsContent value="liste">
          <ListeUtilisateursTab />
        </TabsContent>
        <TabsContent value="creer">
          <CreerUtilisateurTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
