import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  fetchAllLpLandingResolved,
  upsertLpLandingAProposRemess,
  upsertLpLandingEquipeRemess,
  upsertLpLandingNosMembres,
  upsertLpLandingContacterNous,
  upsertLpLandingHeader,
  upsertLpLandingHero,
  upsertLpLandingMotDuPresident,
  upsertLpLandingRemessEnChiffres,
} from "@/lib/lpLandingSectionsDb";
import {
  DEFAULT_A_PROPOS_REMESS_CONTENT,
  DEFAULT_EQUIPE_REMESS_CONTENT,
  DEFAULT_NOS_MEMBRES_CONTENT,
  DEFAULT_CONTACTER_NOUS_CONTENT,
  DEFAULT_HEADER_CONTENT,
  DEFAULT_HERO_CONTENT,
  DEFAULT_MOT_DU_PRESIDENT_CONTENT,
  DEFAULT_REMESS_EN_CHIFFRES_CONTENT,
  type AProposRemessContent,
  type EquipeRemessContent,
  type NosMembresContent,
  type ContacterNousContent,
  type HeaderContent,
  type HeroSectionContent,
  type MotDuPresidentContent,
  type RemessEnChiffresContent,
} from "./types";

/** Postgrest / Auth errors are often plain objects, not `Error` instances. */
function formatCaughtError(reason: unknown): string {
  if (reason instanceof Error && reason.message.trim()) {
    return reason.message.trim();
  }
  if (reason && typeof reason === "object") {
    const o = reason as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) {
      const parts: string[] = [o.message.trim()];
      if (typeof o.details === "string" && o.details.trim()) {
        parts.push(o.details.trim());
      }
      if (typeof o.hint === "string" && o.hint.trim()) {
        parts.push(`Astuce : ${o.hint.trim()}`);
      }
      if (typeof o.code === "string" && o.code.trim()) {
        parts.push(`Code : ${o.code.trim()}`);
      }
      return parts.join(" — ");
    }
    if (typeof o.code === "string" && o.code.trim()) {
      return `Erreur (code ${o.code.trim()})`;
    }
  }
  if (typeof reason === "string" && reason.trim()) {
    return reason.trim();
  }
  try {
    return JSON.stringify(reason);
  } catch {
    return "Erreur inconnue";
  }
}

type LpLandingContentValue = {
  /** Données chargées depuis Supabase (ou défauts si vide / erreur). */
  lpLandingReady: boolean;
  lpLandingLoadError: string | null;
  /** Sauvegarde manuelle : toutes les sections persistées. */
  lpLandingSaving: boolean;
  saveLpLandingToDb: () => Promise<void>;
  reloadLpLandingFromDb: () => Promise<void>;
  header: HeaderContent;
  setHeader: (next: HeaderContent | ((prev: HeaderContent) => HeaderContent)) => void;
  hero: HeroSectionContent;
  setHero: (next: HeroSectionContent | ((prev: HeroSectionContent) => HeroSectionContent)) => void;
  motDuPresident: MotDuPresidentContent;
  setMotDuPresident: (
    next: MotDuPresidentContent | ((prev: MotDuPresidentContent) => MotDuPresidentContent),
  ) => void;
  aProposRemess: AProposRemessContent;
  setAProposRemess: (
    next: AProposRemessContent | ((prev: AProposRemessContent) => AProposRemessContent),
  ) => void;
  remessEnChiffres: RemessEnChiffresContent;
  setRemessEnChiffres: (
    next: RemessEnChiffresContent | ((prev: RemessEnChiffresContent) => RemessEnChiffresContent),
  ) => void;
  equipeRemess: EquipeRemessContent;
  setEquipeRemess: (
    next: EquipeRemessContent | ((prev: EquipeRemessContent) => EquipeRemessContent),
  ) => void;
  nosMembres: NosMembresContent;
  setNosMembres: (
    next: NosMembresContent | ((prev: NosMembresContent) => NosMembresContent),
  ) => void;
  contacterNous: ContacterNousContent;
  setContacterNous: (
    next: ContacterNousContent | ((prev: ContacterNousContent) => ContacterNousContent),
  ) => void;
};

const LpLandingContentContext = createContext<LpLandingContentValue | null>(null);

export function LpLandingContentProvider({ children }: { children: ReactNode }) {
  const [lpLandingReady, setLpLandingReady] = useState(false);
  const [lpLandingLoadError, setLpLandingLoadError] = useState<string | null>(null);
  const [lpLandingSaving, setLpLandingSaving] = useState(false);
  const [header, setHeaderState] = useState<HeaderContent>(DEFAULT_HEADER_CONTENT);
  const [hero, setHeroState] = useState<HeroSectionContent>(DEFAULT_HERO_CONTENT);
  const [motDuPresident, setMotDuPresidentState] = useState<MotDuPresidentContent>(
    DEFAULT_MOT_DU_PRESIDENT_CONTENT,
  );
  const [aProposRemess, setAProposRemessState] = useState<AProposRemessContent>(
    DEFAULT_A_PROPOS_REMESS_CONTENT,
  );
  const [remessEnChiffres, setRemessEnChiffresState] = useState<RemessEnChiffresContent>(
    DEFAULT_REMESS_EN_CHIFFRES_CONTENT,
  );
  const [equipeRemess, setEquipeRemessState] = useState<EquipeRemessContent>(
    DEFAULT_EQUIPE_REMESS_CONTENT,
  );
  const [nosMembres, setNosMembresState] = useState<NosMembresContent>(DEFAULT_NOS_MEMBRES_CONTENT);
  const [contacterNous, setContacterNousState] = useState<ContacterNousContent>(
    DEFAULT_CONTACTER_NOUS_CONTENT,
  );

  const loadFromDb = useCallback(async () => {
    setLpLandingLoadError(null);
    try {
      const merged = await fetchAllLpLandingResolved();
      setHeaderState(merged.header);
      setHeroState(merged.hero);
      setMotDuPresidentState(merged.motDuPresident);
      setAProposRemessState(merged.aProposRemess);
      setRemessEnChiffresState(merged.remessEnChiffres);
      setEquipeRemessState(merged.equipeRemess);
      setNosMembresState(merged.nosMembres);
      setContacterNousState(merged.contacterNous);
    } catch (e) {
      const msg = formatCaughtError(e);
      setLpLandingLoadError(msg);
      toast.error("Chargement landing", { description: msg });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadFromDb();
      if (!cancelled) {
        setLpLandingReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFromDb]);

  const reloadLpLandingFromDb = useCallback(async () => {
    setLpLandingReady(false);
    await loadFromDb();
    setLpLandingReady(true);
  }, [loadFromDb]);

  const saveLpLandingToDb = useCallback(async () => {
    setLpLandingSaving(true);
    try {
      await Promise.all([
        upsertLpLandingHeader(header),
        upsertLpLandingHero(hero),
        upsertLpLandingMotDuPresident(motDuPresident),
        upsertLpLandingAProposRemess(aProposRemess),
        upsertLpLandingRemessEnChiffres(remessEnChiffres),
        upsertLpLandingEquipeRemess(equipeRemess),
        upsertLpLandingNosMembres(nosMembres),
        upsertLpLandingContacterNous(contacterNous),
      ]);
      toast.success("Modifications enregistrées", {
        description:
          "Toutes les sections configurées (dont REMESS en chiffres, l’équipe, nos membres et Contacter nous) ont été sauvegardées.",
      });
    } catch (e) {
      const msg = formatCaughtError(e);
      toast.error("Échec de l’enregistrement", { description: msg });
      throw e;
    } finally {
      setLpLandingSaving(false);
    }
  }, [
    header,
    hero,
    motDuPresident,
    aProposRemess,
    remessEnChiffres,
    equipeRemess,
    nosMembres,
    contacterNous,
  ]);

  const setHeader = useCallback((next: HeaderContent | ((prev: HeaderContent) => HeaderContent)) => {
    setHeaderState(next);
  }, []);

  const setHero = useCallback(
    (next: HeroSectionContent | ((prev: HeroSectionContent) => HeroSectionContent)) => {
      setHeroState(next);
    },
    [],
  );

  const setMotDuPresident = useCallback(
    (next: MotDuPresidentContent | ((prev: MotDuPresidentContent) => MotDuPresidentContent)) => {
      setMotDuPresidentState(next);
    },
    [],
  );

  const setAProposRemess = useCallback(
    (next: AProposRemessContent | ((prev: AProposRemessContent) => AProposRemessContent)) => {
      setAProposRemessState(next);
    },
    [],
  );

  const setRemessEnChiffres = useCallback(
    (
      next:
        | RemessEnChiffresContent
        | ((prev: RemessEnChiffresContent) => RemessEnChiffresContent),
    ) => {
      setRemessEnChiffresState(next);
    },
    [],
  );

  const setEquipeRemess = useCallback(
    (next: EquipeRemessContent | ((prev: EquipeRemessContent) => EquipeRemessContent)) => {
      setEquipeRemessState(next);
    },
    [],
  );

  const setNosMembres = useCallback(
    (next: NosMembresContent | ((prev: NosMembresContent) => NosMembresContent)) => {
      setNosMembresState(next);
    },
    [],
  );

  const setContacterNous = useCallback(
    (next: ContacterNousContent | ((prev: ContacterNousContent) => ContacterNousContent)) => {
      setContacterNousState(next);
    },
    [],
  );

  const value = useMemo(
    () => ({
      lpLandingReady,
      lpLandingLoadError,
      lpLandingSaving,
      saveLpLandingToDb,
      reloadLpLandingFromDb,
      header,
      setHeader,
      hero,
      setHero,
      motDuPresident,
      setMotDuPresident,
      aProposRemess,
      setAProposRemess,
      remessEnChiffres,
      setRemessEnChiffres,
      equipeRemess,
      setEquipeRemess,
      nosMembres,
      setNosMembres,
      contacterNous,
      setContacterNous,
    }),
    [
      lpLandingReady,
      lpLandingLoadError,
      lpLandingSaving,
      saveLpLandingToDb,
      reloadLpLandingFromDb,
      header,
      setHeader,
      hero,
      setHero,
      motDuPresident,
      setMotDuPresident,
      aProposRemess,
      setAProposRemess,
      remessEnChiffres,
      setRemessEnChiffres,
      equipeRemess,
      setEquipeRemess,
      nosMembres,
      setNosMembres,
      contacterNous,
      setContacterNous,
    ],
  );

  return (
    <LpLandingContentContext.Provider value={value}>{children}</LpLandingContentContext.Provider>
  );
}

export function useLpLandingContent() {
  const ctx = useContext(LpLandingContentContext);
  if (!ctx) {
    throw new Error("useLpLandingContent doit être utilisé dans LpLandingContentProvider");
  }
  return ctx;
}
