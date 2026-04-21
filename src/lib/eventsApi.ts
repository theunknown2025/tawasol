import { supabase } from "./supabase";
import type { GestionForm, GestionFormField } from "@/types/gestionForm";

const BUCKET_BANNERS = "event-banners";
const BUCKET_FILES = "event-files";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "")
  .toString()
  .trim()
  .replace(/\/$/, "");

export interface EventFile {
  name: string;
  type: string;
  url: string;
}

export interface Evenement {
  id: string;
  authorId: string;
  authorName: string;
  titre: string;
  description: string;
  bannerUrl: string | null;
  duree: string;
  deadlineInscription: Date | null;
  liens: string[];
  files: EventFile[];
  registrationFormId: string | null;
  publicSlug: string | null;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
}

interface DbEvenement {
  id: string;
  author_id: string;
  profiles?: { full_name: string | null } | null;
  titre: string;
  description: string | null;
  banner_path: string | null;
  duree: string | null;
  deadline_inscription: string | null;
  liens: string[] | unknown;
  registration_form_id: string | null;
  public_slug: string | null;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
  event_files?: { name: string; mime_type: string; storage_path: string; bucket: string }[];
}

function getPublicFileUrl(bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

async function getSignedFileUrl(bucket: string, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) return "";
  return data.signedUrl;
}

function parseLiens(liens: unknown): string[] {
  if (Array.isArray(liens)) return liens.filter((x): x is string => typeof x === "string");
  if (typeof liens === "string") {
    try {
      const parsed = JSON.parse(liens);
      return Array.isArray(parsed) ? parsed.filter((x: unknown): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapDbToEvenement(db: DbEvenement, fileUrls?: Map<string, string>): Evenement {
  const files: EventFile[] = (db.event_files ?? []).map((f) => {
    const key = `${f.bucket}/${f.storage_path}`;
    const url =
      f.bucket === BUCKET_BANNERS
        ? getPublicFileUrl(f.bucket, f.storage_path)
        : fileUrls?.get(key) ?? "";
    return { name: f.name, type: f.mime_type, url };
  });

  return {
    id: db.id,
    authorId: db.author_id,
    authorName:
      (db.profiles && typeof db.profiles === "object" && "full_name" in db.profiles
        ? db.profiles.full_name
        : null) ?? "Anonyme",
    titre: db.titre,
    description: db.description ?? "",
    bannerUrl: db.banner_path ? getPublicFileUrl(BUCKET_BANNERS, db.banner_path) : null,
    duree: db.duree ?? "",
    deadlineInscription: db.deadline_inscription ? new Date(db.deadline_inscription) : null,
    liens: parseLiens(db.liens),
    files,
    registrationFormId: db.registration_form_id ?? null,
    publicSlug: db.public_slug ?? null,
    status: db.status,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

async function loadSignedUrls(
  files: { bucket: string; storage_path: string }[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  await Promise.all(
    files.map(async (f) => {
      if (f.bucket === BUCKET_FILES) {
        const url = await getSignedFileUrl(f.bucket, f.storage_path);
        map.set(`${f.bucket}/${f.storage_path}`, url);
      }
    })
  );
  return map;
}

const selectFields = `
  *,
  profiles!evenements_author_profile_fkey(full_name),
  event_files(name, mime_type, storage_path, bucket)
`;

export async function fetchEvenements(): Promise<Evenement[]> {
  const { data, error } = await supabase
    .from("evenements")
    .select(selectFields)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as DbEvenement[];
  const privateFiles = rows.flatMap((d) =>
    (d.event_files ?? [])
      .filter((f: { bucket: string }) => f.bucket === BUCKET_FILES)
      .map((f: { bucket: string; storage_path: string }) => ({ bucket: f.bucket, storage_path: f.storage_path }))
  );
  const signedUrls = await loadSignedUrls(privateFiles);

  return rows.map((d) => mapDbToEvenement(d, signedUrls));
}

export async function fetchMyEvenements(): Promise<Evenement[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return [];

  const { data, error } = await supabase
    .from("evenements")
    .select(selectFields)
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as DbEvenement[];
  const privateFiles = rows.flatMap((d) =>
    (d.event_files ?? [])
      .filter((f: { bucket: string }) => f.bucket === BUCKET_FILES)
      .map((f: { bucket: string; storage_path: string }) => ({ bucket: f.bucket, storage_path: f.storage_path }))
  );
  const signedUrls = await loadSignedUrls(privateFiles);

  return rows.map((d) => mapDbToEvenement(d, signedUrls));
}

export interface CreateEvenementInput {
  titre: string;
  description: string;
  status: "draft" | "published";
  banner?: File | null;
  duree: string;
  deadlineInscription: string | null;
  liens: string[];
  files: { file: File; name: string; type: string }[];
  registrationFormId?: string | null;
}

export async function createEvenement(input: CreateEvenementInput): Promise<Evenement> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Non authentifié");

  const { data: evt, error } = await supabase
    .from("evenements")
    .insert({
      author_id: user.id,
      titre: input.titre,
      description: input.description || null,
      banner_path: null,
      duree: input.duree || null,
      deadline_inscription: input.deadlineInscription || null,
      liens: input.liens,
      registration_form_id: input.registrationFormId ?? null,
      status: input.status,
    })
    .select()
    .single();

  if (error) throw error;

  const evtId = (evt as { id: string }).id;

  if (input.banner) {
    const ext = input.banner.name.split(".").pop() ?? "jpg";
    const path = `${evtId}/banner_${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_BANNERS)
      .upload(path, input.banner, { upsert: false });
    if (!uploadError) {
      await supabase.from("evenements").update({ banner_path: path }).eq("id", evtId);
    }
  }

  for (const { file, name, type } of input.files) {
    const ext = name.split(".").pop() ?? "bin";
    const path = `${evtId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_FILES)
      .upload(path, file, { upsert: false });
    if (!uploadError) {
      await supabase.from("event_files").insert({
        event_id: evtId,
        name,
        mime_type: type,
        storage_path: path,
        bucket: BUCKET_FILES,
      });
    }
  }

  const created = await fetchEvenements();
  const found = created.find((e) => e.id === evtId);
  if (!found) throw new Error("Événement créé mais introuvable");
  return found;
}

export async function updateEvenement(
  id: string,
  data: {
    titre?: string;
    description?: string;
    duree?: string;
    deadlineInscription?: string | null;
    liens?: string[];
    registrationFormId?: string | null;
    status?: "draft" | "published";
    banner?: File | null;
  }
): Promise<void> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.titre !== undefined) updates.titre = data.titre;
  if (data.description !== undefined) updates.description = data.description;
  if (data.duree !== undefined) updates.duree = data.duree;
  if (data.deadlineInscription !== undefined)
    updates.deadline_inscription = data.deadlineInscription || null;
  if (data.liens !== undefined) updates.liens = data.liens;
  if (data.registrationFormId !== undefined)
    updates.registration_form_id = data.registrationFormId;
  if (data.status !== undefined) updates.status = data.status;

  const { error } = await supabase.from("evenements").update(updates).eq("id", id);
  if (error) throw error;

  if (data.banner) {
    const { data: existing } = await supabase
      .from("evenements")
      .select("banner_path")
      .eq("id", id)
      .single();
    const oldPath = (existing as { banner_path: string | null } | null)?.banner_path;
    if (oldPath) await supabase.storage.from(BUCKET_BANNERS).remove([oldPath]);

    const ext = data.banner.name.split(".").pop() ?? "jpg";
    const path = `${id}/banner_${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_BANNERS)
      .upload(path, data.banner, { upsert: false });
    if (!uploadError) {
      await supabase.from("evenements").update({ banner_path: path }).eq("id", id);
    }
  }
}

export async function deleteEvenement(id: string): Promise<void> {
  const { data: evt } = await supabase.from("evenements").select("banner_path").eq("id", id).single();
  if (evt && (evt as { banner_path: string | null }).banner_path) {
    await supabase.storage
      .from(BUCKET_BANNERS)
      .remove([(evt as { banner_path: string }).banner_path]);
  }

  const { data: files } = await supabase
    .from("event_files")
    .select("bucket, storage_path")
    .eq("event_id", id);

  if (files) {
    for (const f of files) {
      await supabase.storage.from(f.bucket).remove([f.storage_path]);
    }
  }

  await supabase.from("event_subscriptions").delete().eq("event_id", id);
  await supabase.from("event_files").delete().eq("event_id", id);
  const { error } = await supabase.from("evenements").delete().eq("id", id);
  if (error) throw error;
}

// ─── Event subscriptions ───
export type SubscriptionStatus = "pending" | "approved" | "rejected";

export interface EventSubscription {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  status: SubscriptionStatus;
  createdAt: Date;
}

export interface EventWithSubscriptions extends Evenement {
  subscriptions: EventSubscription[];
}

export async function subscribeToEvent(eventId: string): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Non authentifié");

  const { error } = await supabase.from("event_subscriptions").insert({
    event_id: eventId,
    user_id: user.id,
    status: "pending",
  });
  if (error) throw error;
}

async function fetchUserNames(userIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return new Map();
  const { data } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .in("user_id", unique);
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    const r = row as { user_id: string; full_name: string | null };
    map.set(r.user_id, r.full_name ?? "Anonyme");
  }
  return map;
}

export async function fetchSubscriptionsForMyEvents(): Promise<Record<string, EventSubscription[]>> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return {};

  const { data: myEvents } = await supabase
    .from("evenements")
    .select("id")
    .eq("author_id", user.id);
  const eventIds = (myEvents ?? []).map((e: { id: string }) => e.id);
  if (eventIds.length === 0) return {};

  const { data, error } = await supabase
    .from("event_subscriptions")
    .select("id, event_id, user_id, status, created_at")
    .in("event_id", eventIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as Array<{ id: string; event_id: string; user_id: string; status: string; created_at: string }>;
  const userIds = rows.map((r) => r.user_id);
  const names = await fetchUserNames(userIds);

  const byEvent: Record<string, EventSubscription[]> = {};
  for (const row of rows) {
    const eventId = row.event_id;
    if (!byEvent[eventId]) byEvent[eventId] = [];
    byEvent[eventId].push({
      id: row.id,
      eventId,
      userId: row.user_id,
      userName: names.get(row.user_id) ?? "Utilisateur",
      status: row.status as SubscriptionStatus,
      createdAt: new Date(row.created_at),
    });
  }
  return byEvent;
}

export async function fetchEventSubscriptions(eventId: string): Promise<EventSubscription[]> {
  const { data, error } = await supabase
    .from("event_subscriptions")
    .select("id, event_id, user_id, status, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as Array<{ id: string; event_id: string; user_id: string; status: string; created_at: string }>;
  const names = await fetchUserNames(rows.map((r) => r.user_id));

  return rows.map((row) => ({
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    userName: names.get(row.user_id) ?? "Utilisateur",
    status: row.status as SubscriptionStatus,
    createdAt: new Date(row.created_at),
  }));
}

export async function approveSubscription(subscriptionId: string): Promise<void> {
  const { error } = await supabase
    .from("event_subscriptions")
    .update({ status: "approved" })
    .eq("id", subscriptionId);
  if (error) throw error;
}

export async function rejectSubscription(subscriptionId: string): Promise<void> {
  const { error } = await supabase
    .from("event_subscriptions")
    .update({ status: "rejected" })
    .eq("id", subscriptionId);
  if (error) throw error;
}

export interface MySubscription {
  id: string;
  eventId: string;
  status: SubscriptionStatus;
  createdAt: Date;
  event: Evenement;
}

export interface EventFormRegistration {
  id: string;
  eventId: string;
  applicantName: string;
  applicantEmail: string;
  answers: Record<string, string | number | boolean>;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

type DbEventFormRegistration = {
  id: string;
  event_id: string;
  applicant_name: string;
  applicant_email: string;
  answers: Record<string, string | number | boolean> | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

function mapDbRegistration(row: DbEventFormRegistration): EventFormRegistration {
  return {
    id: row.id,
    eventId: row.event_id,
    applicantName: row.applicant_name,
    applicantEmail: row.applicant_email,
    answers: row.answers ?? {},
    status: row.status,
    createdAt: new Date(row.created_at),
  };
}

export interface PublicEventWithForm {
  event: Evenement;
  form: (Pick<GestionForm, "id" | "title" | "description" | "banner" | "formDescription" | "fields" | "submitMessageEnabled" | "submitMessage"> & {
    fields: GestionFormField[];
  }) | null;
}

export async function fetchPublicEventBySlug(slug: string): Promise<PublicEventWithForm | null> {
  const { data, error } = await supabase
    .from("evenements")
    .select(
      `
      *,
      profiles!evenements_author_profile_fkey(full_name),
      event_files(name, mime_type, storage_path, bucket),
      admin_gestion_forms:registration_form_id(
        id,
        title,
        description,
        banner_url,
        form_description,
        fields,
        submit_message_enabled,
        submit_message
      )
    `
    )
    .eq("public_slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const eventRow = data as unknown as DbEvenement;
  const event = mapDbToEvenement(eventRow);

  const formRow = (data as { admin_gestion_forms?: {
    id: string;
    title: string;
    description: string;
    banner_url: string;
    form_description: string;
    fields: unknown;
    submit_message_enabled: boolean;
    submit_message: string;
  } | null }).admin_gestion_forms;

  return {
    event,
    form: formRow
      ? {
          id: formRow.id,
          title: formRow.title,
          description: formRow.description ?? "",
          banner: formRow.banner_url ?? "",
          formDescription: formRow.form_description ?? "",
          fields: (Array.isArray(formRow.fields) ? formRow.fields : []) as GestionFormField[],
          submitMessageEnabled: formRow.submit_message_enabled,
          submitMessage: formRow.submit_message ?? "",
        }
      : null,
  };
}

export async function submitPublicEventRegistration(input: {
  eventId: string;
  applicantName: string;
  applicantEmail: string;
  answers: Record<string, string | number | boolean>;
}): Promise<void> {
  const { error } = await supabase.from("event_form_registrations").insert({
    event_id: input.eventId,
    applicant_name: input.applicantName,
    applicant_email: input.applicantEmail,
    answers: input.answers,
    status: "pending",
  });
  if (error) throw error;
}

export async function fetchFormRegistrationsForMyEvents(): Promise<Record<string, EventFormRegistration[]>> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return {};

  const { data: myEvents } = await supabase.from("evenements").select("id").eq("author_id", user.id);
  const eventIds = (myEvents ?? []).map((e: { id: string }) => e.id);
  if (eventIds.length === 0) return {};

  const { data, error } = await supabase
    .from("event_form_registrations")
    .select("id, event_id, applicant_name, applicant_email, answers, status, created_at")
    .in("event_id", eventIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as DbEventFormRegistration[];
  const byEvent: Record<string, EventFormRegistration[]> = {};
  for (const row of rows) {
    if (!byEvent[row.event_id]) byEvent[row.event_id] = [];
    byEvent[row.event_id].push(mapDbRegistration(row));
  }
  return byEvent;
}

export async function updateFormRegistrationStatus(
  registrationId: string,
  status: "approved" | "rejected"
): Promise<void> {
  const { error } = await supabase
    .from("event_form_registrations")
    .update({ status })
    .eq("id", registrationId);
  if (error) throw error;
}

export async function fetchMySubscriptions(): Promise<MySubscription[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return [];

  const { data, error } = await supabase
    .from("event_subscriptions")
    .select(
      `
      id,
      event_id,
      status,
      created_at,
      evenements(
        *,
        profiles!evenements_author_profile_fkey(full_name),
        event_files(name, mime_type, storage_path, bucket)
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as Array<{
    id: string;
    event_id: string;
    status: string;
    created_at: string;
    evenements: DbEvenement | null;
  }>;

  const result: MySubscription[] = [];
  for (const row of rows) {
    if (!row.evenements) continue;
    const privateFiles = (row.evenements.event_files ?? [])
      .filter((f: { bucket: string }) => f.bucket === BUCKET_FILES)
      .map((f: { bucket: string; storage_path: string }) => ({
        bucket: f.bucket,
        storage_path: f.storage_path,
      }));
    const signedUrls = await loadSignedUrls(privateFiles);
    const event = mapDbToEvenement(row.evenements as DbEvenement, signedUrls);
    result.push({
      id: row.id,
      eventId: row.event_id,
      status: row.status as SubscriptionStatus,
      createdAt: new Date(row.created_at),
      event,
    });
  }
  return result;
}

export async function deleteSubscription(subscriptionId: string): Promise<void> {
  const { error } = await supabase
    .from("event_subscriptions")
    .delete()
    .eq("id", subscriptionId);
  if (error) throw error;
}
