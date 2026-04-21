import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPublications,
  fetchMyPublications,
  createPublication,
  updatePublication,
  deletePublication,
  toggleLike,
  incrementClicks,
  addComment,
  type Publication,
  type CreatePublicationInput,
} from "@/lib/publicationsApi";

const QUERY_KEY_ALL = ["publications", "all"] as const;
const QUERY_KEY_MINE = ["publications", "mine"] as const;

/** Invalidate both publication queries (list + mur) after mutations */
function invalidateAll(queryClient: ReturnType<typeof import("@tanstack/react-query").useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEY_ALL });
  queryClient.invalidateQueries({ queryKey: QUERY_KEY_MINE });
}

export type PublicationsScope = "all" | "mine";

export function usePublications(scope: PublicationsScope = "all") {
  const queryClient = useQueryClient();
  const queryKey = scope === "mine" ? QUERY_KEY_MINE : QUERY_KEY_ALL;
  const queryFn = scope === "mine" ? fetchMyPublications : fetchPublications;

  const { data: publications = [], ...rest } = useQuery({
    queryKey,
    queryFn,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreatePublicationInput) => createPublication(input),
    onSuccess: () => invalidateAll(queryClient),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { text?: string; tags?: string[]; status?: "draft" | "published" };
    }) => updatePublication(id, data),
    onSuccess: () => invalidateAll(queryClient),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePublication(id),
    onSuccess: () => invalidateAll(queryClient),
  });

  const likeMutation = useMutation({
    mutationFn: (id: string) => toggleLike(id),
    onSuccess: () => invalidateAll(queryClient),
  });

  const clicksMutation = useMutation({
    mutationFn: (id: string) => incrementClicks(id),
    onSuccess: () => invalidateAll(queryClient),
  });

  const commentMutation = useMutation({
    mutationFn: ({ publicationId, text }: { publicationId: string; text: string }) =>
      addComment(publicationId, text),
    onSuccess: () => invalidateAll(queryClient),
  });

  return {
    publications,
    isLoading: rest.isLoading,
    error: rest.error,
    refetch: rest.refetch,

    addPublication: (input: CreatePublicationInput) => createMutation.mutateAsync(input),
    updatePublication: (id: string, data: Parameters<typeof updatePublication>[1]) =>
      updateMutation.mutateAsync({ id, data }),
    deletePublication: (id: string) => deleteMutation.mutateAsync(id),
    toggleLike: (id: string) => likeMutation.mutateAsync(id),
    incrementClicks: (id: string) => clicksMutation.mutateAsync(id),
    addComment: (publicationId: string, text: string) =>
      commentMutation.mutateAsync({ publicationId, text }),

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export type { Publication };
