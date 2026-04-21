const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "")
  .toString()
  .trim()
  .replace(/\/$/, "");

export interface CreateUserPayload {
  email: string;
  password: string;
  full_name: string;
  role: "super_admin" | "admin" | "member";
  phone?: string;
  address?: string;
}

export interface CreateUserResponse {
  id?: string;
  email?: string;
  message?: string;
  error?: string;
}

/** Call the create-user Edge Function. Requires Super Admin session. */
export async function createUser(
  token: string,
  payload: CreateUserPayload
): Promise<{ data?: CreateUserResponse; error?: string }> {
  const url = `${supabaseUrl}/functions/v1/create-user`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const json = (await res.json().catch(() => ({}))) as CreateUserResponse & { error?: string };
  if (!res.ok) {
    return { error: json.error ?? `HTTP ${res.status}` };
  }
  return { data: json };
}
