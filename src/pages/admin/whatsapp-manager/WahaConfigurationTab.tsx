import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getWahaIntegrationConfig, upsertWahaIntegrationConfig } from "./wahaIntegrationConfigApi";

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
      const { data, error } = await supabase.functions.invoke("notify-brevo-published", {
        body: { test_waha: true },
      });
      if (error) {
        let detail = error.message ?? "Erreur lors de l’appel à la fonction Edge.";
        if (error instanceof FunctionsHttpError) {
          try {
            const ctx = await error.context.json();
            detail = typeof ctx === "object" ? JSON.stringify(ctx) : String(ctx);
          } catch {
            /* ignore */
          }
        }
        setTestResult(JSON.stringify({ ok: false, error: detail }, null, 2));
        toast.error(detail.slice(0, 200));
        setTestLoading(false);
        return;
      }
      setTestResult(JSON.stringify(data ?? {}, null, 2));
      const parsed = data as { ok?: boolean; error?: string; waha?: { ok?: boolean } };
      if (parsed?.ok === false || parsed?.error) {
        toast.error(parsed.error ?? "Échec du test WAHA");
      } else if (parsed?.waha?.ok === false) {
        toast.error("WAHA : erreur dans la réponse");
      } else {
        toast.success("Test WAHA terminé");
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
