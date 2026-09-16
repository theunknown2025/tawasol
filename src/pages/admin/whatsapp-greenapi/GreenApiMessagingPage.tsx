import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GreenApiConfigurationTab from "./GreenApiConfigurationTab";
import GreenApiSendMessageTab from "./GreenApiSendMessageTab";
import GreenApiHistoryTab from "./GreenApiHistoryTab";

export default function GreenApiMessagingPage() {
  const [tab, setTab] = useState<"config" | "send" | "history">("config");

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-emerald-500/10">
          <MessageCircle className="text-emerald-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Whatsapp messaging</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Notifications et messages vers un groupe WhatsApp via Green API
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
          <TabsList className="mb-6 grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="send">Envoyer</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>
          <TabsContent value="config" className="mt-0 focus-visible:outline-none">
            <GreenApiConfigurationTab />
          </TabsContent>
          <TabsContent value="send" className="mt-0 focus-visible:outline-none">
            <GreenApiSendMessageTab />
          </TabsContent>
          <TabsContent value="history" className="mt-0 focus-visible:outline-none">
            <GreenApiHistoryTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
