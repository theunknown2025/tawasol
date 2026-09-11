import { useQuery } from "@tanstack/react-query";
import { fetchLpLandingContacterNous } from "@/lib/lpLandingSectionsDb";

export function usePublicLpContacterNous() {
  return useQuery({
    queryKey: ["lp-landing-contacter-nous-public"],
    queryFn: async () => {
      try {
        return await fetchLpLandingContacterNous();
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });
}
