/** Row shape for `public.whatsapp_groups` (matches Supabase). */
export interface WhatsappGroup {
  id: string;
  name: string;
  description: string;
  invite_link: string;
  /** Rempli côté API avec '' pour compatibilité SQL ; ignoré par Brevo. */
  wa_group_jid?: string;
  /** ID liste Brevo (Contacts → Listes). */
  brevo_list_id?: number | null;
  notes: string;
  sort_order: number;
  is_active: boolean;
  /** Absent on older rows until migration `20260503190000` is applied. */
  notify_publications?: boolean;
  notify_events?: boolean;
  notify_blogs?: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/** Payload for creating a row (defaults applied in API where omitted). */
export interface WhatsappGroupInsert {
  name: string;
  description?: string;
  invite_link?: string;
  wa_group_jid?: string;
  brevo_list_id?: number | null;
  notes?: string;
  sort_order?: number;
  is_active?: boolean;
  notify_publications?: boolean;
  notify_events?: boolean;
  notify_blogs?: boolean;
  metadata?: Record<string, unknown>;
  created_by: string | null;
}

export type WhatsappGroupUpdate = Partial<
  Pick<
    WhatsappGroup,
    | "name"
    | "description"
    | "invite_link"
    | "wa_group_jid"
    | "brevo_list_id"
    | "notes"
    | "sort_order"
    | "is_active"
    | "notify_publications"
    | "notify_events"
    | "notify_blogs"
    | "metadata"
  >
>;
