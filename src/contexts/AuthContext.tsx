import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase, type Profile, type UserRole, isValidRole } from "@/lib/supabase";

interface AuthContextType {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; profile?: Profile }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Build profile from session user_metadata (avoids DB query / schema introspection) */
function profileFromMetadata(
  userId: string,
  email: string,
  userMetadata: Record<string, unknown> | undefined
): Profile | null {
  const role = userMetadata?.role as UserRole | undefined;
  if (!isValidRole(role)) return null;
  return {
    id: userId,
    user_id: userId,
    email,
    full_name: (userMetadata?.full_name as string) ?? email,
    role,
    phone: (userMetadata?.phone as string) ?? null,
    address: (userMetadata?.address as string) ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  /** Fetch profile from DB - may fail with "Database error querying schema" */
  const fetchProfileFromDb = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase.rpc("get_my_profile");
      if (error) {
        console.warn("RPC get_my_profile failed:", error.message);
        const { data: fallback } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        return fallback;
      }
      return Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch (err) {
      console.warn("fetchProfileFromDb error:", err);
      return null;
    }
  };

  const setSessionState = (
    sessionUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null
  ) => {
    if (!sessionUser) {
      setUser(null);
      setProfile(null);
      return;
    }
    setUser(sessionUser);
    const fromMeta = profileFromMetadata(
      sessionUser.id,
      sessionUser.email ?? "",
      sessionUser.user_metadata
    );
    setProfile(fromMeta);
  };

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error("Supabase getSession error:", error);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        const sessionUser = session?.user ?? null;
        setSessionState(sessionUser);

        if (!sessionUser) {
          setLoading(false);
          return;
        }

        // One DB refresh to enrich profile (is_active, etc.) — never block the first paint on it.
        const dbPromise = fetchProfileFromDb(sessionUser.id).then((p) => {
          if (p) setProfile(p);
        });

        const hasRoleInSession = profileFromMetadata(
          sessionUser.id,
          sessionUser.email ?? "",
          sessionUser.user_metadata
        );

        if (hasRoleInSession) {
          setLoading(false);
          void dbPromise;
          return;
        }

        // No role in JWT metadata — wait for DB once so ProtectedRoute can read role.
        const loadingTimeout = window.setTimeout(() => setLoading(false), 12_000);
        void dbPromise.finally(() => {
          window.clearTimeout(loadingTimeout);
          setLoading(false);
        });
      })
      .catch((err) => {
        console.error("Auth init error:", err);
        setUser(null);
        setProfile(null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setSessionState(sessionUser);
      if (sessionUser) {
        void fetchProfileFromDb(sessionUser.id).then((p) => {
          if (p) setProfile(p);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error as Error };
    const u = data.user;
    if (!u) return { error: null, profile: undefined };
    const fromMeta = profileFromMetadata(u.id, u.email ?? "", u.user_metadata);
    if (fromMeta) {
      void fetchProfileFromDb(u.id).then((p) => {
        if (p) setProfile(p);
      });
      return { error: null, profile: fromMeta };
    }
    const p = await fetchProfileFromDb(u.id);
    if (p) setProfile(p);
    return { error: null, profile: p ?? undefined };
  };

  const signOut = async () => {
    // `local` clears the session in this client immediately; default/global can wait on
    // the network and leave the UI stuck if the request hangs or fails silently.
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      console.warn("signOut:", error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
