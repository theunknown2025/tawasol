import { useQuery } from "@tanstack/react-query";
import { fetchLpLandingHeader } from "@/lib/lpLandingSectionsDb";

export function usePublicLpHeader() {
  return useQuery({
    queryKey: ["lp-landing-header-public"],
    queryFn: async () => {
      try {
        return await fetchLpLandingHeader();
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });
}
