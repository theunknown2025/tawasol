import { useQuery } from "@tanstack/react-query";
import {
  PUBLIC_LANDING_VISIBILITY_QUERY_KEY,
} from "@/lib/lpLandingSectionVisibility";
import { fetchLpLandingSectionVisibilityResolved } from "@/lib/lpLandingSectionVisibilityApi";

export function usePublicLpSectionVisibility() {
  return useQuery({
    queryKey: PUBLIC_LANDING_VISIBILITY_QUERY_KEY,
    queryFn: fetchLpLandingSectionVisibilityResolved,
    staleTime: 10_000,
    refetchOnMount: "always",
  });
}
