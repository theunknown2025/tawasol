import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicLpHeader } from "@/hooks/usePublicLpHeader";
import { getDashboardPath } from "@/lib/supabase";

export default function AuthPage() {
  const { user, profile, loading, signIn, signOut } = useAuth();
  const { data: headerContent } = usePublicLpHeader();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const logoUrl = headerContent?.logoUrl?.trim() ?? "";
  const brandTitle = headerContent?.title?.trim() || "REMESS";

  useEffect(() => {
    const st = location.state as { deactivated?: boolean } | null;
    if (st?.deactivated) {
      setError("Ce compte a été désactivé. Contactez un super administrateur.");
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!user || !profile) return;
    if (profile.is_active === false) {
      void signOut();
      setError("Ce compte a été désactivé. Contactez un super administrateur.");
      return;
    }
    navigate(getDashboardPath(profile.role), { replace: true });
  }, [user, profile, navigate, signOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error: err, profile: signedInProfile } = await signIn(email, password);
      if (err) {
        setError(err.message || "Erreur de connexion");
        return;
      }
      if (signedInProfile?.is_active === false) {
        setError("Ce compte a été désactivé. Contactez un super administrateur.");
        await signOut();
        return;
      }
      const path = getDashboardPath(signedInProfile?.role);
      navigate(path, { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (user && profile?.is_active === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Déconnexion…</div>
      </div>
    );
  }

  if (user && profile && profile.is_active !== false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  const RemessLogoLink = ({ className }: { className?: string }) => (
    <Link
      to="/"
      className={className}
      aria-label="Retour à la page d'accueil REMESS"
      title="Retour à l'accueil"
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="REMESS"
          className="h-14 w-auto max-w-[220px] object-contain"
        />
      ) : (
        <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {brandTitle}
        </span>
      )}
    </Link>
  );

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 bg-[hsl(var(--sidebar-bg))] items-center justify-center p-12">
        <div className="max-w-md text-center">
          <Link
            to="/"
            className="mb-6 inline-flex items-center justify-center"
            aria-label="Retour à la page d'accueil REMESS"
            title="Retour à l'accueil"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="REMESS"
                className="h-20 w-auto max-w-[280px] object-contain"
              />
            ) : (
              <h1 className="text-4xl font-bold text-[hsl(var(--sidebar-active))]">
                {brandTitle}
              </h1>
            )}
          </Link>
          <p className="text-[hsl(var(--sidebar-fg))] text-lg leading-relaxed">
            Accédez à votre espace membre REMESS.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-4">
            <RemessLogoLink className="inline-flex" />
            <div>
              <h2 className="text-3xl font-bold text-foreground">Connexion</h2>
              <p className="mt-2 text-muted-foreground">
                Connectez-vous à votre compte
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              />
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Connexion..." : "Se connecter"}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
