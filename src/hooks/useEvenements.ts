import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchEvenements,
  fetchMyEvenements,
  createEvenement,
  updateEvenement,
  deleteEvenement,
  type Evenement,
  type CreateEvenementInput,
} from "@/lib/eventsApi";

const QUERY_KEY_ALL = ["evenements", "all"] as const;
const QUERY_KEY_MINE = ["evenements", "mine"] as const;

function invalidateAll(queryClient: ReturnType<typeof import("@tanstack/react-query").useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEY_ALL });
  queryClient.invalidateQueries({ queryKey: QUERY_KEY_MINE });
}

export type EvenementsScope = "all" | "mine";

export function useEvenements(scope: EvenementsScope = "all") {
  const queryClient = useQueryClient();
  const queryKey = scope === "mine" ? QUERY_KEY_MINE : QUERY_KEY_ALL;
  const queryFn = scope === "mine" ? fetchMyEvenements : fetchEvenements;

  const { data: evenements = [], ...rest } = useQuery({
    queryKey,
    queryFn,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateEvenementInput) => createEvenement(input),
    onSuccess: () => invalidateAll(queryClient),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateEvenement>[1];
    }) => updateEvenement(id, data),
    onSuccess: () => invalidateAll(queryClient),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvenement(id),
    onSuccess: () => invalidateAll(queryClient),
  });

  return {
    evenements,
    isLoading: rest.isLoading,
    error: rest.error,
    refetch: rest.refetch,

    addEvenement: (input: CreateEvenementInput) => createMutation.mutateAsync(input),
    updateEvenement: (id: string, data: Parameters<typeof updateEvenement>[1]) =>
      updateMutation.mutateAsync({ id, data }),
    deleteEvenement: (id: string) => deleteMutation.mutateAsync(id),

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export type { Evenement };
