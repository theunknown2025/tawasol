import { useState } from "react";
import { Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailGroupCreateTab from "./EmailGroupCreateTab";
import EmailGroupsListTab from "./EmailGroupsListTab";
import EmailHistoryTab from "./EmailHistoryTab";

export default function WhatsappManagerPage() {
  const [tab, setTab] = useState<"nouveau" | "listes" | "historique">("nouveau");

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-emerald-500/10">
          <Mail className="text-emerald-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Groupes destinataires — envoi via Postfix / Dovecot (SMTP)
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
          <TabsList className="mb-6 grid w-full max-w-xl grid-cols-3">
            <TabsTrigger value="nouveau">Nouveau groupe</TabsTrigger>
            <TabsTrigger value="listes">Listes groupes</TabsTrigger>
            <TabsTrigger value="historique">Historique</TabsTrigger>
          </TabsList>
          <TabsContent value="nouveau" className="mt-0 focus-visible:outline-none">
            <EmailGroupCreateTab onCreated={() => setTab("listes")} />
          </TabsContent>
          <TabsContent value="listes" className="mt-0 focus-visible:outline-none">
            <EmailGroupsListTab />
          </TabsContent>
          <TabsContent value="historique" className="mt-0 focus-visible:outline-none">
            <EmailHistoryTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
