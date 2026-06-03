import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOpportunity,
  deleteOpportunity,
  fetchMyOpportunities,
  fetchPublishedGestionFormsForSelect,
  setOpportunityPublishStatus,
  updateOpportunity,
  uploadOpportunityBanner,
  uploadOpportunityDocument,
} from "@/lib/opportunitiesApi";
import type { OpportunityInput } from "@/types/opportunity";

const QUERY_KEY = ["opportunities", "admin"];

export function useOpportunities() {
  const queryClient = useQueryClient();

  const opportunitiesQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchMyOpportunities,
  });

  const formsQuery = useQuery({
    queryKey: ["gestion-forms", "published-select"],
    queryFn: fetchPublishedGestionFormsForSelect,
  });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: createOpportunity,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: OpportunityInput }) => updateOpportunity(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOpportunity,
    onSuccess: invalidate,
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "draft" | "published" }) =>
      setOpportunityPublishStatus(id, status),
    onSuccess: invalidate,
  });

  const bannerMutation = useMutation({
    mutationFn: uploadOpportunityBanner,
  });

  const documentMutation = useMutation({
    mutationFn: ({ file, label }: { file: File; label: string }) =>
      uploadOpportunityDocument(file, label),
  });

  return {
    opportunities: opportunitiesQuery.data ?? [],
    publishedForms: formsQuery.data ?? [],
    isLoading: opportunitiesQuery.isLoading,
    isSaving:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      publishMutation.isPending,
    isUploadingBanner: bannerMutation.isPending,
    isUploadingDocument: documentMutation.isPending,
    createOpportunity: createMutation.mutateAsync,
    updateOpportunity: (id: string, input: OpportunityInput) =>
      updateMutation.mutateAsync({ id, input }),
    deleteOpportunity: deleteMutation.mutateAsync,
    setPublishStatus: (id: string, status: "draft" | "published") =>
      publishMutation.mutateAsync({ id, status }),
    uploadBanner: bannerMutation.mutateAsync,
    uploadDocument: documentMutation.mutateAsync,
    refetch: opportunitiesQuery.refetch,
  };
}
