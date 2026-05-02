import { useQuery } from "@tanstack/react-query";
import { fetchLpLandingFooter } from "@/lib/lpLandingSectionsDb";

export function usePublicLpFooter() {
  return useQuery({
    queryKey: ["lp-landing-footer-public"],
    queryFn: async () => {
      try {
        return await fetchLpLandingFooter();
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });
}
