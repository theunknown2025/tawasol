import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getWahaIntegrationConfig, upsertWahaIntegrationConfig } from "./wahaIntegrationConfigApi";

const CONFIG_QUERY_KEY = ["waha-integration-config"] as const;

export default function BrevoConfigurationTab() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    public_site_url: "",
    brevo_notes: "",
    internal_notes: "",
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
      public_site_url: config.public_site_url ?? "",
      brevo_notes: config.brevo_notes ?? "",
      internal_notes: config.internal_notes ?? "",
    });
  }, [config]);

  const saveMut = useMutation({
    mutationFn: () =>
      upsertWahaIntegrationConfig({
        public_site_url: form.public_site_url,
        brevo_notes: form.brevo_notes,
        internal_notes: form.internal_notes,
        waha_base_url_note: config?.waha_base_url_note ?? "",
      }),
    onSuccess: () => {
      toast.success("Configuration email enregistrée");
      void queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleTestBrevo = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("notify-brevo-published", {
        body: { test_brevo: true },
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
      const parsed = data as { ok?: boolean; error?: string };
      if (parsed?.ok === false || parsed?.error) {
        toast.error(parsed.error ?? "Échec du test Brevo");
      } else {
        toast.success("Test Brevo : clé API reconnue");
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
        <h2 className="text-lg font-semibold text-foreground">Configuration Brevo</h2>
        <p className="text-sm text-muted-foreground">
          Les clés et l’expéditeur réels sont dans Supabase :{" "}
          <strong className="text-foreground">Edge Functions → Secrets</strong> —{" "}
          <code className="text-xs bg-muted px-1 rounded">BREVO_API_KEY</code>,{" "}
          <code className="text-xs bg-muted px-1 rounded">BREVO_SENDER_EMAIL</code>,{" "}
          <code className="text-xs bg-muted px-1 rounded">BREVO_SENDER_NAME</code>,{" "}
          <code className="text-xs bg-muted px-1 rounded">PUBLIC_SITE_URL</code>, et optionnellement{" "}
          <code className="text-xs bg-muted px-1 rounded">WEBHOOK_SECRET</code> (header{" "}
          <code className="text-xs bg-muted px-1 rounded">x-webhook-secret</code> pour les webhooks base de données).
        </p>
        <p className="text-xs text-muted-foreground">
          Webhook URL :{" "}
          <code className="bg-muted px-1 rounded">
            …/functions/v1/notify-brevo-published
          </code>
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bcfg-site">URL publique du site (référence)</Label>
          <Input
            id="bcfg-site"
            value={form.public_site_url}
            onChange={(e) => setForm((f) => ({ ...f, public_site_url: e.target.value }))}
            placeholder="http://localhost:8080 ou https://www.exemple.com"
          />
          <p className="text-xs text-muted-foreground">
            À aligner avec le secret <code className="bg-muted px-1 rounded">PUBLIC_SITE_URL</code>.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bcfg-brevo-notes">Notes Brevo (référence)</Label>
          <Textarea
            id="bcfg-brevo-notes"
            value={form.brevo_notes}
            onChange={(e) => setForm((f) => ({ ...f, brevo_notes: e.target.value }))}
            placeholder="Expéditeur vérifié dans Brevo, IDs de listes de test, lien vers la doc interne…"
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Ne pas coller la clé API ici — uniquement dans les secrets Edge Function.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bcfg-notes">Notes internes</Label>
          <Textarea
            id="bcfg-notes"
            value={form.internal_notes}
            onChange={(e) => setForm((f) => ({ ...f, internal_notes: e.target.value }))}
            placeholder="Procédures, contacts…"
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
          <Button type="button" variant="secondary" onClick={handleTestBrevo} disabled={testLoading}>
            {testLoading ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <FlaskConical className="size-4 mr-2" />
            )}
            Test Brevo (clé API)
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Le test appelle l’API Brevo (<code className="bg-muted px-1 rounded">GET /account</code>) pour valider{" "}
          <code className="bg-muted px-1 rounded">BREVO_API_KEY</code>. Il n’envoie pas de campagne.
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
