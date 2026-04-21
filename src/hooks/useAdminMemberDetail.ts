import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminOrganizationProfile,
  fetchAdminProfileLinks,
  fetchAdminLegalDocuments,
  adminSetProfileActive,
  getAdminDocumentSignedUrl,
} from "@/lib/adminProfileApi";
import type { Profile } from "@/lib/supabase";

export const adminMemberDetailKey = (userId: string | undefined) =>
  ["admin-member-detail", userId] as const;

export function useAdminMemberDetail(member: Profile | null) {
  const userId = member?.user_id;
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: adminMemberDetailKey(userId),
    queryFn: async () => {
      if (!userId) return null;
      const [org, links, docs] = await Promise.all([
        fetchAdminOrganizationProfile(userId),
        fetchAdminProfileLinks(userId),
        fetchAdminLegalDocuments(userId),
      ]);
      return { org, links, docs };
    },
    enabled: !!userId && !!member,
  });

  const setActiveMutation = useMutation({
    mutationFn: async ({ user_id, is_active }: { user_id: string; is_active: boolean }) => {
      return adminSetProfileActive(user_id, is_active);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles", "all"] });
      queryClient.invalidateQueries({ queryKey: adminMemberDetailKey(userId) });
    },
  });

  return {
    ...detailQuery,
    setAccountActive: setActiveMutation.mutateAsync,
    setActiveLoading: setActiveMutation.isPending,
    signedUrlFor: getAdminDocumentSignedUrl,
  };
}
