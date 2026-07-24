import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getWahaIntegrationConfig, upsertWahaIntegrationConfig } from "./wahaIntegrationConfigApi";
import { testWahaConnection } from "./wahaEdgeApi";

const CONFIG_QUERY_KEY = ["waha-integration-config"] as const;

export default function WahaConfigurationTab() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    waha_base_url_note: "",
  });
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: CONFIG_QUERY_KEY,
    queryFn: getWahaIntegrationConfig,
  });

  useEffect(() => {
    if (!config) return;
    setForm({
      waha_base_url_note: config.waha_base_url_note ?? "",
    });
  }, [config]);

  const saveMut = useMutation({
    mutationFn: () =>
      upsertWahaIntegrationConfig({
        public_site_url: config?.public_site_url ?? "",
        brevo_notes: config?.brevo_notes ?? "",
        internal_notes: config?.internal_notes ?? "",
        waha_base_url_note: form.waha_base_url_note,
      }),
    onSuccess: () => {
      toast.success("Configuration WAHA enregistrée");
      void queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleTestWaha = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const { data, error } = await testWahaConnection();
      if (error) {
        setTestResult(JSON.stringify({ ok: false, error }, null, 2));
        toast.error(error.slice(0, 200));
        return;
      }
      setTestResult(JSON.stringify(data ?? {}, null, 2));
      if (data?.ok === false || data?.error) {
        toast.error(data.error ?? "Échec du test WAHA");
        return;
      }
      const sent = data?.sent ?? 0;
      const failed = (data?.results ?? []).filter((r) => !r.ok);
      if (sent === 0) {
        toast.warning(
          failed.length > 0
            ? "Aucun message envoyé — vérifiez les JID (onglet Groupes) et WAHA_BASE_URL."
            : "Aucun groupe actif avec JID — configurez l’onglet Groupes.",
        );
      } else {
        toast.success(`Test WAHA : ${sent} message(s) envoyé(s)`);
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
        <h2 className="text-lg font-semibold text-foreground">Configuration WAHA</h2>
        <p className="text-sm text-muted-foreground">
          L’URL de base du serveur WAHA est fournie par le secret Supabase{" "}
          <code className="text-xs bg-muted px-1 rounded">WAHA_BASE_URL</code> (Edge Functions → Secrets). Les notes
          ci‑dessous sont uniquement pour la documentation interne.
        </p>
        <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1 mt-2">
          <li>
            Secrets requis : <code className="bg-muted px-1 rounded">WAHA_BASE_URL</code>, optionnel{" "}
            <code className="bg-muted px-1 rounded">WAHA_SESSION</code> (défaut : default),{" "}
            <code className="bg-muted px-1 rounded">WAHA_API_KEY</code>,{" "}
            <code className="bg-muted px-1 rounded">PUBLIC_SITE_URL</code>
          </li>
          <li>Le serveur WAHA doit être joignable depuis Supabase (pas localhost sans tunnel).</li>
          <li>Session WhatsApp connectée (QR) sur l’instance WAHA.</li>
          <li>Les publications déclenchent automatiquement l’envoi (triggers base de données).</li>
          <li>
            Si vous utilisez <code className="bg-muted px-1 rounded">WEBHOOK_SECRET</code>, les triggers DB ne l’envoient pas
            encore — laissez ce secret vide ou contactez l’équipe pour l’aligner.
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="wcfg-waha-note">Notes URL / instance WAHA</Label>
          <Textarea
            id="wcfg-waha-note"
            value={form.waha_base_url_note}
            onChange={(e) => setForm((f) => ({ ...f, waha_base_url_note: e.target.value }))}
            placeholder="Ex. https://waha.exemple.com — session « default », profil dédié…"
            rows={5}
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
          <Button type="button" variant="secondary" onClick={handleTestWaha} disabled={testLoading}>
            {testLoading ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <FlaskConical className="size-4 mr-2" />
            )}
            Test WAHA (envoi test)
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Le test envoie un message court à tous les groupes actifs ayant un JID valide (voir onglet Groupes).
        </p>
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
