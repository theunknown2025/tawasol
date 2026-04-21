import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchAdminOrganizationProfile,
  fetchAdminProfileLinks,
  fetchAdminLegalDocuments,
  upsertAdminOrganizationProfile,
  replaceAdminProfileLinks,
  uploadAdminLegalDocument,
  deleteAdminLegalDocument,
  type AdminDocCategory,
  type AdminOrgProfileInput,
} from "@/lib/adminProfileApi";

export const adminProfileQueryKey = (userId: string | undefined) => ["admin-profile", userId] as const;

export function useAdminProfile() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: adminProfileQueryKey(userId),
    queryFn: async () => {
      if (!userId) return null;
      const [org, links, docs] = await Promise.all([
        fetchAdminOrganizationProfile(userId),
        fetchAdminProfileLinks(userId),
        fetchAdminLegalDocuments(userId),
      ]);
      return { org, links, docs };
    },
    enabled: !!userId,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      org: AdminOrgProfileInput;
      links: { label: string; url: string; sort_order: number }[];
    }) => {
      if (!userId) throw new Error("Non connecté");
      await upsertAdminOrganizationProfile(userId, payload.org);
      await replaceAdminProfileLinks(userId, payload.links);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProfileQueryKey(userId) });
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: async ({ file, category }: { file: File; category: AdminDocCategory }) => {
      if (!userId) throw new Error("Non connecté");
      return uploadAdminLegalDocument(userId, file, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProfileQueryKey(userId) });
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: deleteAdminLegalDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProfileQueryKey(userId) });
    },
  });

  return {
    userId,
    ...query,
    saveProfile: saveMutation.mutateAsync,
    saveLoading: saveMutation.isPending,
    uploadDocument: uploadDocMutation.mutateAsync,
    uploadLoading: uploadDocMutation.isPending,
    deleteDocument: deleteDocMutation.mutateAsync,
    deleteLoading: deleteDocMutation.isPending,
  };
}
