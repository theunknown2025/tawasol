import { supabase } from "@/lib/supabase";
import type { GestionForm } from "@/types/gestionForm";
import type {
  ApplicationDecision,
  Opportunity,
  OpportunityApplication,
  OpportunityDocument,
  OpportunityInput,
  OpportunitiesPublicSettings,
} from "@/types/opportunity";
import type { HeroSlideBackground } from "@/pages/super-admin/LP_Manager/types";

const BANNERS_BUCKET = "opportunities-banners";
const DOCUMENTS_BUCKET = "opportunities-documents";
const APPLICATION_FILES_BUCKET = "opportunity-application-files";

type DbOpportunity = {
  id: string;
  title: string;
  opportunity_type: string;
  format: string;
  contract_type: string | null;
  duration_start: string | null;
  duration_end: string | null;
  salary_mad: number | null;
  deadline: string;
  location: string;
  description: string;
  banner: HeroSlideBackground;
  registration_form_id: string | null;
  documents: OpportunityDocument[];
  status: string;
  public_slug: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type DbApplication = {
  id: string;
  opportunity_id: string;
  applicant_name: string;
  applicant_email: string;
  answers: Record<string, string>;
  file_uploads: Record<string, { url: string; path: string; fileName: string }>;
  decision: ApplicationDecision;
  created_at: string;
  updated_at: string;
};

function mapDbToOpportunity(row: DbOpportunity): Opportunity {
  return {
    id: row.id,
    title: row.title,
    opportunityType: row.opportunity_type as Opportunity["opportunityType"],
    format: row.format as Opportunity["format"],
    contractType: row.contract_type as Opportunity["contractType"],
    durationStart: row.duration_start,
    durationEnd: row.duration_end,
    salaryMad: row.salary_mad,
    deadline: row.deadline,
    location: row.location,
    description: row.description,
    banner: row.banner ?? { type: "solid", color: "#4f46e5" },
    registrationFormId: row.registration_form_id,
    documents: Array.isArray(row.documents) ? row.documents : [],
    status: row.status as Opportunity["status"],
    publicSlug: row.public_slug,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDbToApplication(row: DbApplication): OpportunityApplication {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    applicantName: row.applicant_name,
    applicantEmail: row.applicant_email,
    answers: row.answers ?? {},
    fileUploads: row.file_uploads ?? {},
    decision: row.decision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDbPayload(input: OpportunityInput) {
  return {
    title: input.title,
    opportunity_type: input.opportunityType,
    format: input.format,
    contract_type: input.contractType,
    duration_start: input.durationStart,
    duration_end: input.durationEnd,
    salary_mad: input.salaryMad,
    deadline: input.deadline,
    location: input.location,
    description: input.description,
    banner: input.banner,
    registration_form_id: input.registrationFormId,
    documents: input.documents,
    status: input.status,
    published_at: input.status === "published" ? new Date().toISOString() : null,
  };
}

export async function fetchMyOpportunities(): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from("lp_opportunities")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as DbOpportunity[]).map(mapDbToOpportunity);
}

export async function fetchPublishedOpportunities(limit?: number): Promise<Opportunity[]> {
  let query = supabase
    .from("lp_opportunities")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as DbOpportunity[]).map(mapDbToOpportunity);
}

export async function fetchPublicOpportunityBySlug(slug: string): Promise<{
  opportunity: Opportunity;
  form: GestionForm | null;
} | null> {
  const { data: oppRow, error: oppError } = await supabase
    .from("lp_opportunities")
    .select("*")
    .eq("public_slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (oppError) throw oppError;
  if (!oppRow) return null;

  const opportunity = mapDbToOpportunity(oppRow as DbOpportunity);
  if (!opportunity.registrationFormId) {
    return { opportunity, form: null };
  }

  const { data: formRow, error: formError } = await supabase
    .from("admin_gestion_forms")
    .select("*")
    .eq("id", opportunity.registrationFormId)
    .eq("status", "published")
    .maybeSingle();
  if (formError) throw formError;
  if (!formRow) return { opportunity, form: null };

  const f = formRow as {
    id: string;
    title: string;
    description: string;
    banner_url: string;
    form_description: string;
    fields: GestionForm["fields"];
    submit_message_enabled: boolean;
    submit_message: string;
    status: string;
    created_at: string;
    updated_at: string;
  };

  return {
    opportunity,
    form: {
      id: f.id,
      title: f.title,
      description: f.description,
      banner: f.banner_url,
      formDescription: f.form_description,
      fields: f.fields ?? [],
      submitMessageEnabled: f.submit_message_enabled,
      submitMessage: f.submit_message,
      status: f.status as GestionForm["status"],
      createdAt: f.created_at,
      updatedAt: f.updated_at,
    },
  };
}

export async function createOpportunity(input: OpportunityInput): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Non authentifié");

  const { data, error } = await supabase
    .from("lp_opportunities")
    .insert({ ...toDbPayload(input), created_by: user.id })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateOpportunity(id: string, input: OpportunityInput): Promise<void> {
  const { error } = await supabase.from("lp_opportunities").update(toDbPayload(input)).eq("id", id);
  if (error) throw error;
}

export async function deleteOpportunity(id: string): Promise<void> {
  const { error } = await supabase.from("lp_opportunities").delete().eq("id", id);
  if (error) throw error;
}

export async function setOpportunityPublishStatus(
  id: string,
  status: "draft" | "published",
): Promise<void> {
  const { error } = await supabase
    .from("lp_opportunities")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function uploadOpportunityBanner(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const filePath = `banners/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BANNERS_BUCKET).upload(filePath, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(BANNERS_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadOpportunityDocument(file: File, label: string): Promise<OpportunityDocument> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const filePath = `docs/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(filePath, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(filePath);
  return {
    id: crypto.randomUUID(),
    label: label.trim() || file.name,
    url: data.publicUrl,
    fileName: file.name,
  };
}

export async function uploadApplicationFile(
  opportunityId: string,
  fieldId: string,
  file: File,
): Promise<{ url: string; path: string; fileName: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const filePath = `${opportunityId}/${fieldId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(APPLICATION_FILES_BUCKET).upload(filePath, file, {
    upsert: false,
  });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(APPLICATION_FILES_BUCKET).getPublicUrl(filePath);
  return { url: urlData.publicUrl, path: filePath, fileName: file.name };
}

export async function submitOpportunityApplication(payload: {
  opportunityId: string;
  applicantName: string;
  applicantEmail: string;
  answers: Record<string, string>;
  fileUploads: Record<string, { url: string; path: string; fileName: string }>;
}): Promise<void> {
  const { error } = await supabase.from("lp_opportunity_applications").insert({
    opportunity_id: payload.opportunityId,
    applicant_name: payload.applicantName,
    applicant_email: payload.applicantEmail,
    answers: payload.answers,
    file_uploads: payload.fileUploads,
  });
  if (error) throw error;
}

export async function fetchApplicationsForOpportunity(
  opportunityId: string,
): Promise<OpportunityApplication[]> {
  const { data, error } = await supabase
    .from("lp_opportunity_applications")
    .select("*")
    .eq("opportunity_id", opportunityId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as DbApplication[]).map(mapDbToApplication);
}

export async function updateApplicationDecision(
  applicationId: string,
  decision: ApplicationDecision,
): Promise<void> {
  const { error } = await supabase
    .from("lp_opportunity_applications")
    .update({ decision })
    .eq("id", applicationId);
  if (error) throw error;
}

const DEFAULT_OPPORTUNITY_PAGE_SIZE = 15;

function normalizePageSize(value: number | null | undefined): number {
  if (value === 5 || value === 15 || value === 50) return value;
  return DEFAULT_OPPORTUNITY_PAGE_SIZE;
}

export async function fetchPublishedGestionFormsForSelect(): Promise<
  { id: string; title: string }[]
> {
  const { data, error } = await supabase
    .from("admin_gestion_forms")
    .select("id, title")
    .eq("status", "published")
    .order("title");
  if (error) throw error;
  return (data ?? []) as { id: string; title: string }[];
}

export async function fetchOpportunitiesPublicSettings(): Promise<OpportunitiesPublicSettings> {
  const { data, error } = await supabase
    .from("lp_opportunities_public_settings")
    .select("display_mode, page_size")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return {
    displayMode: (data?.display_mode as OpportunitiesPublicSettings["displayMode"]) ?? "card",
    pageSize: normalizePageSize(data?.page_size),
  };
}

export async function updateOpportunitiesPublicSettings(
  settings: OpportunitiesPublicSettings,
): Promise<void> {
  const { error } = await supabase
    .from("lp_opportunities_public_settings")
    .upsert({
      id: 1,
      display_mode: settings.displayMode,
      page_size: normalizePageSize(settings.pageSize),
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}

export async function getApplicationFileSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(APPLICATION_FILES_BUCKET)
    .createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function fetchGestionFormById(formId: string): Promise<GestionForm | null> {
  const { data, error } = await supabase
    .from("admin_gestion_forms")
    .select("*")
    .eq("id", formId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const f = data as {
    id: string;
    title: string;
    description: string;
    banner_url: string;
    form_description: string;
    fields: GestionForm["fields"];
    submit_message_enabled: boolean;
    submit_message: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  return {
    id: f.id,
    title: f.title,
    description: f.description,
    banner: f.banner_url,
    formDescription: f.form_description,
    fields: f.fields ?? [],
    submitMessageEnabled: f.submit_message_enabled,
    submitMessage: f.submit_message,
    status: f.status as GestionForm["status"],
    createdAt: f.created_at,
    updatedAt: f.updated_at,
  };
}
