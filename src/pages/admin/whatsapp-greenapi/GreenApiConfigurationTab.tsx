import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getGreenApiMessagingConfig,
  upsertGreenApiMessagingConfig,
} from "./greenApiMessagingConfigApi";
import { testGreenApiConnection } from "./greenApiEdgeApi";
import { cn } from "@/lib/utils";

const CONFIG_QUERY_KEY = ["green-api-messaging-config"] as const;

function extractGroupChatId(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  const embedded = t.match(/(\d{8,}@g\.us)\b/i);
  if (embedded?.[1]) return embedded[1];
  if (t.endsWith("@g.us")) return t;
  return t;
}

/** Instance 7107… → https://7107.api.green-api.com */
function deriveApiUrlFromInstanceId(instanceId: string): string | null {
  const m = instanceId.trim().match(/^(\d{4})\d+$/);
  if (!m?.[1]) return null;
  return `https://${m[1]}.api.green-api.com`;
}

export default function GreenApiConfigurationTab() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    instance_id: "",
    api_token: "",
    api_url: "https://api.green-api.com",
    group_name: "",
    group_chat_id: "",
    notes: "",
  });
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testSummary, setTestSummary] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: CONFIG_QUERY_KEY,
    queryFn: getGreenApiMessagingConfig,
  });

  useEffect(() => {
    if (!config) return;
    setForm({
      instance_id: config.instance_id ?? "",
      api_token: config.api_token ?? "",
      api_url: config.api_url || "https://api.green-api.com",
      group_name: config.group_name ?? "",
      group_chat_id: extractGroupChatId(config.group_chat_id ?? ""),
      notes: config.notes ?? "",
    });
  }, [config]);

  const saveMut = useMutation({
    mutationFn: () =>
      upsertGreenApiMessagingConfig({
        ...form,
        group_chat_id: extractGroupChatId(form.group_chat_id),
      }),
    onSuccess: (saved) => {
      toast.success("Configuration Green API enregistrée");
      queryClient.setQueryData(CONFIG_QUERY_KEY, saved);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleTest = async () => {
    setTestLoading(true);
    setTestSummary({ ok: false, message: "Test en cours…" });
    try {
      const cleaned = {
        ...form,
        group_chat_id: extractGroupChatId(form.group_chat_id),
      };
      setForm(cleaned);

      const saved = await upsertGreenApiMessagingConfig(cleaned);
      queryClient.setQueryData(CONFIG_QUERY_KEY, saved);

      const { data, error } = await testGreenApiConnection({
        instance_id: cleaned.instance_id,
        api_token: cleaned.api_token,
        api_url: cleaned.api_url,
        group_name: cleaned.group_name,
        group_chat_id: cleaned.group_chat_id,
      });

      const payload = data ?? {
        ok: false,
        error: error ?? "Aucune réponse",
        message: error ?? "Aucune réponse",
      };
      const message =
        (typeof payload.message === "string" && payload.message) ||
        (typeof payload.error === "string" && payload.error) ||
        error ||
        "Test terminé";
      const ok = payload.ok === true;

      setTestResult(JSON.stringify(payload, null, 2));
      setTestSummary({ ok, message });

      if (ok) toast.success(message);
      else toast.error(message.slice(0, 220));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const payload = { ok: false, error: msg, message: msg };
      setTestResult(JSON.stringify(payload, null, 2));
      setTestSummary({ ok: false, message: msg });
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
        <h2 className="text-lg font-semibold text-foreground">Configuration Green API</h2>
        <p className="text-sm text-muted-foreground">
          Instance ID, token et groupe WhatsApp (console Green API). Un seul groupe pour les
          notifications et l’envoi manuel.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ga-instance-id">Instance ID</Label>
          <Input
            id="ga-instance-id"
            value={form.instance_id}
            onChange={(e) => {
              const instance_id = e.target.value;
              const derived = deriveApiUrlFromInstanceId(instance_id);
              setForm((f) => ({
                ...f,
                instance_id,
                // Auto-fill API URL when empty or still a previous auto host
                api_url:
                  derived &&
                  (!f.api_url.trim() ||
                    /^https:\/\/\d{4}\.api\.green-api\.com$/i.test(f.api_url.trim()) ||
                    f.api_url.trim() === "https://api.green-api.com")
                    ? derived
                    : f.api_url,
              }));
            }}
            placeholder="Ex. 710722734428"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ga-token">API Token</Label>
          <Input
            id="ga-token"
            type="password"
            value={form.api_token}
            onChange={(e) => setForm((f) => ({ ...f, api_token: e.target.value }))}
            placeholder="apiTokenInstance"
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ga-api-url">API URL</Label>
          <Input
            id="ga-api-url"
            value={form.api_url}
            onChange={(e) => setForm((f) => ({ ...f, api_url: e.target.value }))}
            placeholder="https://7107.api.green-api.com"
          />
          <p className="text-xs text-muted-foreground">
            Doit correspondre à l’instance : pour{" "}
            <code className="text-[11px] bg-muted px-1 rounded">710722734428</code> →{" "}
            <code className="text-[11px] bg-muted px-1 rounded">https://7107.api.green-api.com</code>
            . Copiez apiUrl depuis la console Green API (pas un autre cluster comme 1103).
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ga-group-name">Nom du groupe</Label>
          <Input
            id="ga-group-name"
            value={form.group_name}
            onChange={(e) => setForm((f) => ({ ...f, group_name: e.target.value }))}
            placeholder="Ex. REMESS — Annonces"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ga-group-chat-id">ID du groupe (chatId)</Label>
          <Input
            id="ga-group-chat-id"
            value={form.group_chat_id}
            onChange={(e) => setForm((f) => ({ ...f, group_chat_id: e.target.value }))}
            placeholder="120363…@g.us"
          />
          <p className="text-xs text-muted-foreground">
            Uniquement l’identifiant WhatsApp se terminant par @g.us (pas le nom du groupe).
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ga-notes">Notes</Label>
          <Textarea
            id="ga-notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="QR autorisé, numéro du bot…"
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

      <div
        className={cn(
          "rounded-xl border p-4 space-y-3",
          testSummary?.ok === true && "border-emerald-500/40 bg-emerald-500/5",
          testSummary?.ok === false && testResult && "border-destructive/40 bg-destructive/5",
          !testSummary && "border-border bg-muted/30",
          testLoading && "border-border bg-muted/30",
        )}
      >
        <p className="text-sm font-medium">Résultat du test</p>
        {testSummary ? (
          <p
            className={cn(
              "text-sm",
              testSummary.ok ? "text-emerald-700 dark:text-emerald-400" : "text-destructive",
            )}
          >
            {testLoading ? "Test en cours…" : testSummary.message}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Lancez le test pour voir le statut de la connexion.
          </p>
        )}
        {testResult ? (
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all max-h-64 overflow-y-auto bg-background rounded-lg p-3 border border-border">
            {testResult}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
