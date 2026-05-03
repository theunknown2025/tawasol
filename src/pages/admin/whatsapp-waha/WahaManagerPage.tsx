import { useState } from "react";
import { Phone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WahaGroupsPanel from "../whatsapp-manager/WahaGroupsPanel";
import WahaConfigurationTab from "../whatsapp-manager/WahaConfigurationTab";

export default function WahaManagerPage() {
  const [tab, setTab] = useState<"groupes" | "config">("groupes");

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-emerald-500/10">
          <Phone className="text-emerald-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">WhatsApp (WAHA)</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Groupes, liens d’invitation et configuration du serveur WAHA
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
          <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="groupes">Groupes</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>
          <TabsContent value="groupes" className="mt-0 focus-visible:outline-none">
            <WahaGroupsPanel />
          </TabsContent>
          <TabsContent value="config" className="mt-0 focus-visible:outline-none">
            <WahaConfigurationTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
