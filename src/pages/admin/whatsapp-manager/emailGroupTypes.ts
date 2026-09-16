export interface EmailGroupMember {
  id: string;
  group_id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export interface EmailGroup {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  members?: EmailGroupMember[];
}

export type EmailGroupMemberInput = {
  full_name: string;
  email: string;
};
