/**
 * Shown when VITE_SUPABASE_* were missing at build time (typical on VPS if .env was lost).
 */
export default function MissingSupabaseConfigPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 py-12 text-center">
      <div className="max-w-lg space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Configuration Supabase manquante
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Les variables{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">VITE_SUPABASE_URL</code> et{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">VITE_SUPABASE_ANON_KEY</code>{" "}
          doivent être définies dans <code className="text-xs">.env</code> ou{" "}
          <code className="text-xs">.env.production</code> sur le serveur,{" "}
          <strong>avant</strong> <code className="text-xs">npm run build</code> (Vite les intègre
          au build).
        </p>
        <ol className="text-muted-foreground list-decimal space-y-2 pl-5 text-left text-sm">
          <li>
            Créer ou éditer <code className="text-xs">/var/www/tawasol/.env</code> (copier depuis{" "}
            <code className="text-xs">.env.example</code> si besoin).
          </li>
          <li>
            Lancer : <code className="text-xs">npm run build</code> puis{" "}
            <code className="text-xs">sudo systemctl reload nginx</code>
          </li>
        </ol>
      </div>
    </div>
  );
}
