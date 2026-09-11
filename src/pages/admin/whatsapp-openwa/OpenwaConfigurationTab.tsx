import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getOpenwaMessagingConfig, upsertOpenwaMessagingConfig } from "./openwaMessagingConfigApi";
import { testOpenwaConnection } from "./openwaEdgeApi";

const CONFIG_QUERY_KEY = ["openwa-messaging-config"] as const;

export default function OpenwaConfigurationTab() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    group_name: "",
    group_invite_link: "",
    group_jid: "",
    notes: "",
  });
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: CONFIG_QUERY_KEY,
    queryFn: getOpenwaMessagingConfig,
  });

  useEffect(() => {
    if (!config) return;
    setForm({
      group_name: config.group_name ?? "",
      group_invite_link: config.group_invite_link ?? "",
      group_jid: config.group_jid ?? "",
      notes: config.notes ?? "",
    });
  }, [config]);

  const saveMut = useMutation({
    mutationFn: () => upsertOpenwaMessagingConfig(form),
    onSuccess: () => {
      toast.success("Configuration WhatsApp enregistrée");
      void queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleTest = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      if (
        form.group_name !== (config?.group_name ?? "") ||
        form.group_invite_link !== (config?.group_invite_link ?? "") ||
        form.group_jid !== (config?.group_jid ?? "") ||
        form.notes !== (config?.notes ?? "")
      ) {
        await upsertOpenwaMessagingConfig(form);
        void queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY });
      }

      const { data, error } = await testOpenwaConnection();
      setTestResult(JSON.stringify(data ?? { error }, null, 2));
      if (error) {
        toast.error(error.slice(0, 200));
        return;
      }
      if (data?.ok === false || data?.error) {
        toast.error(data.error ?? "Échec du test OpenWA");
        return;
      }
      toast.success(data?.message ?? "Connexion OpenWA OK");
      if (data?.group?.group_jid) {
        void queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setTestResult(JSON.stringify({ ok: false, error: msg }, null, 2));
      toast.error(msg);
    } finally {
      setTestLoading(false);
    }
  };

  if (isLoading && !config) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
        <Loader2 className="animate-spin size-4" />
        Chargement…
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Configuration & connexion</h2>
        <p className="text-sm text-muted-foreground">
          Ajoutez le lien d’invitation du groupe WhatsApp (≈25 membres). Les secrets serveur restent dans
          Supabase Edge Functions :{" "}
          <code className="text-xs bg-muted px-1 rounded">OPENWA_BASE_URL</code>,{" "}
          <code className="text-xs bg-muted px-1 rounded">OPENWA_API_KEY</code>,{" "}
          <code className="text-xs bg-muted px-1 rounded">OPENWA_SESSION_ID</code>.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="owa-group-name">Nom du groupe</Label>
          <Input
            id="owa-group-name"
            value={form.group_name}
            onChange={(e) => setForm((f) => ({ ...f, group_name: e.target.value }))}
            placeholder="Ex. REMESS — Annonces"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="owa-invite">Lien d’invitation WhatsApp</Label>
          <Input
            id="owa-invite"
            value={form.group_invite_link}
            onChange={(e) => setForm((f) => ({ ...f, group_invite_link: e.target.value }))}
            placeholder="https://chat.whatsapp.com/…"
          />
          <p className="text-xs text-muted-foreground">
            Le bot OpenWA doit pouvoir rejoindre ce groupe (ou y être déjà).
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="owa-jid">JID du groupe (optionnel)</Label>
          <Input
            id="owa-jid"
            value={form.group_jid}
            onChange={(e) => setForm((f) => ({ ...f, group_jid: e.target.value }))}
            placeholder="120363…@g.us — rempli automatiquement après un test réussi"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="owa-notes">Notes</Label>
          <Textarea
            id="owa-notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Procédure QR OpenWA, URL du dashboard…"
            rows={3}
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="button" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <Save className="size-4 mr-2" />
            )}
            Enregistrer
          </Button>
          <Button type="button" variant="secondary" onClick={() => void handleTest()} disabled={testLoading}>
            {testLoading ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <FlaskConical className="size-4 mr-2" />
            )}
            Tester la connexion
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
        <p className="text-sm font-medium">Dernier résultat</p>
        {testResult ? (
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all max-h-64 overflow-y-auto bg-background rounded-lg p-3 border border-border">
            {testResult}
          </pre>
        ) : (
          <p className="text-xs text-muted-foreground">Lancez le test pour voir la réponse JSON.</p>
        )}
      </div>
    </div>
  );
}
