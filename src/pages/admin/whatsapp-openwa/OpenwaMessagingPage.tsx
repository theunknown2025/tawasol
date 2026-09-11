import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OpenwaSendMessageTab from "./OpenwaSendMessageTab";
import OpenwaConfigurationTab from "./OpenwaConfigurationTab";

export default function OpenwaMessagingPage() {
  const [tab, setTab] = useState<"send" | "config">("send");

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-emerald-500/10">
          <MessageCircle className="text-emerald-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Whatsapp messaging</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Envoi de messages texte vers un groupe WhatsApp via OpenWA
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
          <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="send">Envoyer</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>
          <TabsContent value="send" className="mt-0 focus-visible:outline-none">
            <OpenwaSendMessageTab />
          </TabsContent>
          <TabsContent value="config" className="mt-0 focus-visible:outline-none">
            <OpenwaConfigurationTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
