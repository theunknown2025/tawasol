import { useNavigate } from "react-router-dom";
import { ExternalLink, LayoutTemplate, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const remessHomeUrl =
  (import.meta.env.VITE_REMESS_HOME_URL as string | undefined)?.trim() ||
  "https://remess.ma";

const surveyAiUrl = (import.meta.env.VITE_SURVEY_AI_URL as string | undefined)?.trim();

export default function AdminPortailPage() {
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();

  const openSurveyAi = () => {
    if (surveyAiUrl) {
      window.open(surveyAiUrl, "_blank", "noopener,noreferrer");
      return;
    }
    toast.info("URL Survey — AI non configurée. Ajoutez VITE_SURVEY_AI_URL dans votre fichier d’environnement.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border px-6 md:px-10">
        <span className="text-sm font-semibold text-foreground">Espace Remess</span>
        <div className="flex items-center gap-4">
          {profile?.full_name && (
            <span className="hidden text-sm text-muted-foreground sm:inline">{profile.full_name}</span>
          )}
          <button
            type="button"
            onClick={() => {
              void (async () => {
                try {
                  await signOut();
                } catch (e) {
                  console.error(e);
                } finally {
                  navigate("/auth", { replace: true });
                }
              })();
            }}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <p className="mb-10 max-w-lg text-center text-muted-foreground">
          Choisissez une application pour continuer.
        </p>

        <div className="grid w-full max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
          <div className="flex aspect-square max-w-[280px] mx-auto w-full flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-card p-6 text-center shadow-sm transition hover:border-primary/40 hover:shadow-md hover:shadow-primary/10">
            <ExternalLink className="h-10 w-10 shrink-0 text-primary opacity-90" aria-hidden />
            <span className="text-lg font-semibold text-foreground leading-snug">
              Page d&apos;accueil Remess
            </span>
            <div className="flex w-full flex-col gap-2">
              <a
                href={remessHomeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                Ouvrir le site
              </a>
              <button
                type="button"
                onClick={() => navigate("/admin/remess-landing")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <LayoutTemplate className="h-4 w-4 shrink-0" />
                Éditeur de la page
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="group flex aspect-square max-w-[280px] mx-auto w-full flex-col items-center justify-center rounded-3xl border-2 border-primary/30 bg-primary/5 p-6 text-center shadow-sm transition hover:border-primary hover:bg-primary/10 hover:shadow-md hover:shadow-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-md shadow-primary/25">
              T
            </span>
            <span className="text-lg font-semibold text-foreground">Tawasol</span>
            <span className="mt-2 text-xs text-muted-foreground">Espace d&apos;administration</span>
          </button>

          <button
            type="button"
            onClick={openSurveyAi}
            className="group flex aspect-square max-w-[280px] mx-auto w-full flex-col items-center justify-center rounded-3xl border border-border bg-card p-6 text-center shadow-sm transition hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Sparkles className="mb-4 h-10 w-10 text-primary opacity-90 transition group-hover:scale-105" />
            <span className="text-lg font-semibold text-foreground leading-snug">Survey — AI</span>
          </button>
        </div>
      </main>
    </div>
  );
}
