/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Page d’accueil Remess (lien depuis le portail admin) */
  readonly VITE_REMESS_HOME_URL?: string;
  /** URL externe Survey — AI (optionnel) */
  readonly VITE_SURVEY_AI_URL?: string;
  /** OpenAI — analyse IA des publications (Mur) */
  readonly VITE_OPENAI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
