import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { createUser, deleteUser, type CreateUserPayload } from "@/lib/usersApi";
import { adminSetProfileActive } from "@/lib/adminProfileApi";
import type { Profile, UserRole } from "@/lib/supabase";

async function listAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.rpc("list_all_profiles");
  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  return rows.map((row: Record<string, unknown>) => ({
    ...row,
    id: (row.id ?? row.user_id) as string,
    phone: row.phone ?? null,
    address: row.address ?? null,
    is_active: row.is_active !== false,
  })) as Profile[];
}

async function adminUpdateProfile(input: {
  user_id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  address: string | null;
}): Promise<Profile> {
  const { data, error } = await supabase.rpc("admin_update_profile", {
    p_user_id: input.user_id,
    p_full_name: input.full_name,
    p_role: input.role,
    p_phone: input.phone,
    p_address: input.address,
  });
  if (error) throw error;
  return (data ?? {}) as Profile;
}

/** Returns true if a profile with this email already exists. */
export async function checkUserEmailExists(email: string): Promise<boolean> {
  const normalized = email.trim();
  if (!normalized) return false;
  const { count, error } = await supabase
    .from("profiles")
    .select("user_id", { count: "exact", head: true })
    .ilike("email", normalized);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export function useUsers() {
  const queryClient = useQueryClient();

  const {
    data: profiles = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["profiles", "all"],
    queryFn: listAllProfiles,
  });

  const createUserMutation = useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Non connecté");
      }
      const { data, error } = await createUser(session.access_token, payload);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles", "all"] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: adminUpdateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles", "all"] });
    },
  });

  const suspendUserMutation = useMutation({
    mutationFn: async ({ user_id, is_active }: { user_id: string; is_active: boolean }) => {
      return adminSetProfileActive(user_id, is_active);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles", "all"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Non connecté");
      }
      const { data, error } = await deleteUser(session.access_token, userId);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles", "all"] });
    },
  });

  return {
    profiles,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createUser: createUserMutation.mutateAsync,
    createUserLoading: createUserMutation.isPending,
    createUserError: createUserMutation.error instanceof Error ? createUserMutation.error.message : null,
    updateUser: updateUserMutation.mutateAsync,
    updateUserLoading: updateUserMutation.isPending,
    updateUserError: updateUserMutation.error instanceof Error ? updateUserMutation.error.message : null,
    suspendUser: suspendUserMutation.mutateAsync,
    suspendUserLoading: suspendUserMutation.isPending,
    deleteUser: deleteUserMutation.mutateAsync,
    deleteUserLoading: deleteUserMutation.isPending,
    checkUserEmailExists,
  };
}
