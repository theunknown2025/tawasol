import { useEffect, useState } from "react";

const ACTIVITIES_URL = "/data/barometre/activities.json";

export function useBarometreActivities() {
  const [activities, setActivities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(ACTIVITIES_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as unknown;
        let list: string[] = [];
        if (Array.isArray(data)) {
          list = data.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
        } else if (data && typeof data === "object" && "activities" in data) {
          const raw = (data as { activities?: unknown }).activities;
          if (Array.isArray(raw)) {
            list = raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
          }
        }
        if (!cancelled) setActivities(list);
      } catch {
        if (!cancelled) {
          setActivities([]);
          setError("Impossible de charger la liste des activités.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { activities, isLoading, error };
}
