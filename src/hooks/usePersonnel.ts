import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Personnel, PersonnelFormData } from "@/types/personnel";

export function usePersonnel() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonnel = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("personnel")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
      setPersonnel([]);
    } else {
      setPersonnel((data ?? []) as Personnel[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  const createPersonnel = async (
    form: PersonnelFormData,
    createAuthUser: boolean
  ): Promise<{ error: string | null }> => {
    let userId: string | null = null;

    if (createAuthUser && form.password && form.confirmPassword) {
      if (form.password !== form.confirmPassword) {
        return { error: "Les mots de passe ne correspondent pas." };
      }
      if (form.password.length < 6) {
        return { error: "Le mot de passe doit contenir au moins 6 caractères." };
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            role: "member",
          },
          emailRedirectTo: undefined,
        },
      });

      if (authError) {
        return { error: authError.message };
      }
      userId = authData.user?.id ?? null;
    }

    const { error: insertError } = await supabase.from("personnel").insert({
      user_id: userId,
      full_name: form.full_name,
      phone: form.phone || null,
      email: form.email,
      position: form.position || null,
    });

    if (insertError) return { error: insertError.message };
    await fetchPersonnel();
    return { error: null };
  };

  const updatePersonnel = async (
    id: string,
    data: Partial<PersonnelFormData>
  ): Promise<{ error: string | null }> => {
    const { error: updateError } = await supabase
      .from("personnel")
      .update({
        full_name: data.full_name,
        phone: data.phone || null,
        email: data.email,
        position: data.position || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) return { error: updateError.message };
    await fetchPersonnel();
    return { error: null };
  };

  const deletePersonnel = async (id: string): Promise<{ error: string | null }> => {
    const { error: deleteError } = await supabase.from("personnel").delete().eq("id", id);

    if (deleteError) return { error: deleteError.message };
    await fetchPersonnel();
    return { error: null };
  };

  const suspendPersonnel = async (
    id: string,
    suspended: boolean
  ): Promise<{ error: string | null }> => {
    const { error: updateError } = await supabase
      .from("personnel")
      .update({ is_suspended: suspended, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) return { error: updateError.message };
    await fetchPersonnel();
    return { error: null };
  };

  return {
    personnel,
    loading,
    error,
    fetchPersonnel,
    createPersonnel,
    updatePersonnel,
    deletePersonnel,
    suspendPersonnel,
  };
}
