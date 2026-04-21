import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GestionFormInput } from "@/types/gestionForm";
import { fetchMyGestionForms } from "@/lib/gestionFormsQueriesApi";
import {
  createGestionForm,
  deleteGestionForm,
  setGestionFormPublishStatus,
  updateGestionForm,
  uploadGestionFormBanner,
} from "@/lib/gestionFormsMutationsApi";

const QUERY_KEY_MINE = ["gestion-forms", "mine"] as const;

export function useGestionForms() {
  const queryClient = useQueryClient();

  const { data: forms = [], ...query } = useQuery({
    queryKey: QUERY_KEY_MINE,
    queryFn: fetchMyGestionForms,
  });

  const invalidateMine = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY_MINE });
  };

  const createMutation = useMutation({
    mutationFn: (input: GestionFormInput) => createGestionForm(input),
    onSuccess: invalidateMine,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: GestionFormInput }) =>
      updateGestionForm(id, input),
    onSuccess: invalidateMine,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGestionForm(id),
    onSuccess: invalidateMine,
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "draft" | "published" }) =>
      setGestionFormPublishStatus(id, status),
    onSuccess: invalidateMine,
  });

  const bannerMutation = useMutation({
    mutationFn: (file: File) => uploadGestionFormBanner(file),
  });

  return {
    forms,
    isLoading: query.isLoading,
    createForm: (input: GestionFormInput) => createMutation.mutateAsync(input),
    updateForm: (id: string, input: GestionFormInput) =>
      updateMutation.mutateAsync({ id, input }),
    deleteForm: (id: string) => deleteMutation.mutateAsync(id),
    setPublishStatus: (id: string, status: "draft" | "published") =>
      publishMutation.mutateAsync({ id, status }),
    uploadBanner: (file: File) => bannerMutation.mutateAsync(file),
    isSaving: createMutation.isPending || updateMutation.isPending || publishMutation.isPending,
    isUploadingBanner: bannerMutation.isPending,
  };
}
