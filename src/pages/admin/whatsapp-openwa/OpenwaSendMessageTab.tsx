import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getOpenwaMessagingConfig } from "./openwaMessagingConfigApi";
import { sendOpenwaText } from "./openwaEdgeApi";

const CONFIG_QUERY_KEY = ["openwa-messaging-config"] as const;

export default function OpenwaSendMessageTab() {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: CONFIG_QUERY_KEY,
    queryFn: getOpenwaMessagingConfig,
  });

  const groupLabel =
    config?.group_name?.trim() ||
    config?.group_jid?.trim() ||
    (config?.group_invite_link?.trim() ? "Groupe configuré" : null);

  const canSend = Boolean(
    text.trim() && (config?.group_invite_link?.trim() || config?.group_jid?.trim()),
  );

  const handleSend = async () => {
    const message = text.trim();
    if (!message) {
      toast.error("Saisissez un message");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await sendOpenwaText(message);
      if (error) {
        toast.error(error.slice(0, 200));
        return;
      }
      if (data?.ok === false || data?.error) {
        toast.error(data.error ?? "Échec de l’envoi");
        return;
      }
      toast.success("Message envoyé sur WhatsApp");
      setText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
        <Loader2 className="animate-spin size-4" />
        Chargement…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Envoyer un message</h2>
        <p className="text-sm text-muted-foreground">
          Envoi texte vers le groupe défini dans l’onglet Configuration (événements, projets,
          opportunités, etc.).
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
        {groupLabel ? (
          <p>
            Destinataire : <span className="font-medium text-foreground">{groupLabel}</span>
            {config?.group_jid ? (
              <span className="block text-xs text-muted-foreground mt-1 font-mono">{config.group_jid}</span>
            ) : null}
          </p>
        ) : (
          <p className="text-muted-foreground">
            Aucun groupe configuré — ajoutez le lien d’invitation dans l’onglet Configuration.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="owa-message">Message</Label>
        <Textarea
          id="owa-message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex. Nouvel événement publié : …"
          rows={8}
          className="resize-y min-h-[160px]"
        />
      </div>

      <Button type="button" onClick={() => void handleSend()} disabled={!canSend || sending}>
        {sending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Send className="size-4 mr-2" />}
        Envoyer
      </Button>
    </div>
  );
}
