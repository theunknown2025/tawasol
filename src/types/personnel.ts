export interface Personnel {
  id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  email: string;
  position: string | null;
  is_suspended?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonnelFormData {
  full_name: string;
  phone: string;
  email: string;
  position: string;
  password?: string;
  confirmPassword?: string;
}
