import { useState } from "react";
import { Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrevoListsPanel from "./BrevoListsPanel";
import BrevoConfigurationTab from "./BrevoConfigurationTab";

export default function WhatsappManagerPage() {
  const [tab, setTab] = useState<"listes" | "config">("listes");

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-emerald-500/10">
          <Mail className="text-emerald-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email (Brevo)</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Listes d’envoi et configuration des notifications email
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
          <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="listes">Listes d’envoi</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>
          <TabsContent value="listes" className="mt-0 focus-visible:outline-none">
            <BrevoListsPanel />
          </TabsContent>
          <TabsContent value="config" className="mt-0 focus-visible:outline-none">
            <BrevoConfigurationTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
