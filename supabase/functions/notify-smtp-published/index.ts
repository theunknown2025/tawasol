/**
 * Notifications → Email via Postfix + Dovecot (SMTP on VPS).
 * Tables: publications, evenements, lp_projets, lp_opportunities, blogs
 * when status becomes published.
 *
 * Secrets: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
 *   SMTP_FROM, SMTP_FROM_NAME, PUBLIC_SITE_URL, WEBHOOK_SECRET
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
};

type ContentType = "publication" | "event" | "project" | "opportunity" | "blog";

type MemberRow = {
  email: string;
  full_name: string;
  group_id: string;
  group_name: string;
};

type BuiltEmail = {
  contentType: ContentType;
  contentId: string | null;
  contentTitle: string;
  authorName: string;
  content: string;
  link: string;
  subject: string;
  text: string;
  html: string;
};

function optionalEnv(name: string): string | undefined {
  const v = Deno.env.get(name);
  return v?.trim() || undefined;
}

function requireEnv(name: string): string {
  const v = optionalEnv(name);
  if (!v) throw new Error(`${name} manquant dans les secrets Edge Function`);
  return v;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function shouldNotifyPublish(payload: WebhookPayload): boolean {
  const r = payload.record;
  if (!r || r.status !== "published") return false;
  if (payload.type === "INSERT") return true;
  const old = payload.old_record;
  if (!old) return true;
  return old.status !== "published";
}

function siteBase(): string {
  return (optionalEnv("PUBLIC_SITE_URL") ?? "").replace(/\/$/, "") || "https://beta-remess.pro";
}

function buildHtml(params: {
  heading: string;
  authorLabel: string;
  authorName: string;
  contentLabel: string;
  content: string;
  linkLabel: string;
  link: string;
}): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;line-height:1.5;color:#222;max-width:640px;margin:0 auto;padding:24px">
  <h2 style="margin:0 0 16px;font-size:18px">${escapeHtml(params.heading)}</h2>
  <p style="margin:0 0 8px"><strong>${escapeHtml(params.authorLabel)}</strong><br/>${escapeHtml(params.authorName)}</p>
  <p style="margin:16px 0 8px"><strong>${escapeHtml(params.contentLabel)}</strong></p>
  <div style="padding:12px 14px;background:#f6f6f6;border-radius:8px;white-space:pre-wrap">${escapeHtml(params.content)}</div>
  <p style="margin:20px 0 8px"><strong>${escapeHtml(params.linkLabel)}</strong></p>
  <p style="margin:0"><a href="${escapeHtml(params.link)}" style="color:#0b6e4f">${escapeHtml(params.link)}</a></p>
  <p style="margin-top:28px;color:#666;font-size:12px">REMESS — notification automatique</p>
</body>
</html>`;
}

async function resolveAuthorName(
  supabase: SupabaseClient,
  userId: string | null | undefined,
): Promise<string> {
  const id = String(userId ?? "").trim();
  if (!id) return "REMESS";
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", id)
    .maybeSingle();
  return profile?.full_name ? String(profile.full_name) : "REMESS";
}

async function buildContentEmail(
  supabase: SupabaseClient,
  table: string,
  record: Record<string, unknown>,
): Promise<BuiltEmail | null> {
  const base = siteBase();
  const id = String(record.id ?? "").trim() || null;

  if (table === "publications") {
    const authorName = await resolveAuthorName(supabase, String(record.author_id ?? ""));
    const content = String(record.text ?? "").trim() || "(sans contenu)";
    const link = `${base}/member/mur`;
    const subject = "Nouvelle publication — REMESS";
    const text =
      `Publication User: ${authorName}\n\nPublication Content:\n${content}\n\nPublication Link: ${link}\n`;
    return {
      contentType: "publication",
      contentId: id,
      contentTitle: truncate(content, 80),
      authorName,
      content,
      link,
      subject,
      text,
      html: buildHtml({
        heading: "Nouvelle publication",
        authorLabel: "Publication User",
        authorName,
        contentLabel: "Publication Content",
        content,
        linkLabel: "Publication Link",
        link,
      }),
    };
  }

  if (table === "evenements") {
    const authorName = await resolveAuthorName(supabase, String(record.author_id ?? ""));
    const title = String(record.titre ?? "Événement").trim();
    const content = stripHtml(String(record.description ?? "")) || title;
    const slug = String(record.public_slug ?? "").trim();
    const link = slug ? `${base}/event/${slug}` : `${base}/events`;
    const subject = `Nouvel événement — ${truncate(title, 60)}`;
    const text =
      `Event User: ${authorName}\n\nEvent Title: ${title}\n\nEvent Content:\n${content}\n\nEvent Link: ${link}\n`;
    return {
      contentType: "event",
      contentId: id,
      contentTitle: title,
      authorName,
      content: `${title}\n\n${content}`,
      link,
      subject,
      text,
      html: buildHtml({
        heading: "Nouvel événement",
        authorLabel: "Event User",
        authorName,
        contentLabel: "Event Content",
        content: `${title}\n\n${content}`,
        linkLabel: "Event Link",
        link,
      }),
    };
  }

  if (table === "lp_projets") {
    const authorName = await resolveAuthorName(supabase, String(record.created_by ?? ""));
    const title = String(record.title ?? "Projet").trim();
    const content = stripHtml(String(record.description ?? "")) || title;
    const slug = String(record.public_slug ?? "").trim();
    const link = slug ? `${base}/projet/${slug}` : `${base}/projets`;
    const subject = `Nouveau projet — ${truncate(title, 60)}`;
    const text =
      `Project User: ${authorName}\n\nProject Title: ${title}\n\nProject Content:\n${content}\n\nProject Link: ${link}\n`;
    return {
      contentType: "project",
      contentId: id,
      contentTitle: title,
      authorName,
      content: `${title}\n\n${content}`,
      link,
      subject,
      text,
      html: buildHtml({
        heading: "Nouveau projet",
        authorLabel: "Project User",
        authorName,
        contentLabel: "Project Content",
        content: `${title}\n\n${content}`,
        linkLabel: "Project Link",
        link,
      }),
    };
  }

  if (table === "lp_opportunities") {
    const authorName = await resolveAuthorName(supabase, String(record.created_by ?? ""));
    const title = String(record.title ?? "Opportunité").trim();
    const content = stripHtml(String(record.description ?? "")) || title;
    const slug = String(record.public_slug ?? "").trim();
    const link = slug ? `${base}/opportunite/${slug}` : `${base}/opportunites`;
    const subject = `Nouvelle opportunité — ${truncate(title, 60)}`;
    const text =
      `Opportunity User: ${authorName}\n\nOpportunity Title: ${title}\n\nOpportunity Content:\n${content}\n\nOpportunity Link: ${link}\n`;
    return {
      contentType: "opportunity",
      contentId: id,
      contentTitle: title,
      authorName,
      content: `${title}\n\n${content}`,
      link,
      subject,
      text,
      html: buildHtml({
        heading: "Nouvelle opportunité",
        authorLabel: "Opportunity User",
        authorName,
        contentLabel: "Opportunity Content",
        content: `${title}\n\n${content}`,
        linkLabel: "Opportunity Link",
        link,
      }),
    };
  }

  if (table === "blogs") {
    const authorName = await resolveAuthorName(supabase, String(record.author_id ?? ""));
    const title = String(record.title ?? "Article").trim();
    const content = stripHtml(String(record.content ?? "")) || title;
    const slug = String(record.slug ?? "").trim();
    const link = slug ? `${base}/blog/${slug}` : `${base}/blogs`;
    const subject = `Nouvel article — ${truncate(title, 60)}`;
    const text =
      `Blog User: ${authorName}\n\nBlog Title: ${title}\n\nBlog Content:\n${content}\n\nBlog Link: ${link}\n`;
    return {
      contentType: "blog",
      contentId: id,
      contentTitle: title,
      authorName,
      content: `${title}\n\n${content}`,
      link,
      subject,
      text,
      html: buildHtml({
        heading: "Nouvel article de blog",
        authorLabel: "Blog User",
        authorName,
        contentLabel: "Blog Content",
        content: `${title}\n\n${content}`,
        linkLabel: "Blog Link",
        link,
      }),
    };
  }

  return null;
}

async function sendOneEmail(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const host = requireEnv("SMTP_HOST");
  const port = Number.parseInt(optionalEnv("SMTP_PORT") ?? "587", 10);
  const user = requireEnv("SMTP_USER");
  const pass = optionalEnv("SMTP_PASS") ?? optionalEnv("SMTP_PASSWORD");
  if (!pass) throw new Error("SMTP_PASS (ou SMTP_PASSWORD) manquant");
  const fromEmail = optionalEnv("SMTP_FROM") ?? "noreply@beta-remess.pro";
  const fromName = optionalEnv("SMTP_FROM_NAME") ?? "REMESS";

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    requireTLS: port === 587,
  });

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody: unknown = await req.json().catch(() => undefined);

    const webhookSecret = optionalEnv("WEBHOOK_SECRET");
    if (webhookSecret) {
      const h = req.headers.get("x-webhook-secret");
      if (h !== webhookSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payload = rawBody as WebhookPayload;
    if (!payload || typeof payload !== "object") {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.type === "DELETE" || !payload.record) {
      return new Response(JSON.stringify({ ok: true, skipped: "delete or empty record" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowed = ["publications", "evenements", "lp_projets", "lp_opportunities", "blogs"];
    if (!allowed.includes(payload.table)) {
      return new Response(JSON.stringify({ ok: true, skipped: "unsupported table" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!shouldNotifyPublish(payload)) {
      return new Response(JSON.stringify({ ok: true, skipped: "not a publish transition" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    if (!supabaseUrl || !serviceKey) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const built = await buildContentEmail(supabase, payload.table, payload.record);
    if (!built) {
      return new Response(JSON.stringify({ ok: true, skipped: "unhandled content" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: groups, error: gErr } = await supabase
      .from("email_notification_groups")
      .select("id, name, members:email_notification_group_members(email, full_name)")
      .eq("is_active", true);

    if (gErr) throw gErr;

    const members: MemberRow[] = [];
    const seenEmails = new Set<string>();

    for (const g of groups ?? []) {
      const groupId = String((g as { id: string }).id);
      const groupName = String((g as { name?: string }).name ?? "");
      const rows = (g as { members?: { email?: string; full_name?: string }[] }).members ?? [];
      for (const m of rows) {
        const email = String(m.email ?? "").trim().toLowerCase();
        if (!email.includes("@") || seenEmails.has(email)) continue;
        seenEmails.add(email);
        members.push({
          email,
          full_name: String(m.full_name ?? "").trim(),
          group_id: groupId,
          group_name: groupName,
        });
      }
    }

    if (members.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: "aucun membre dans les groupes actifs" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    requireEnv("SMTP_HOST");
    requireEnv("SMTP_USER");
    if (!(optionalEnv("SMTP_PASS") ?? optionalEnv("SMTP_PASSWORD"))) {
      throw new Error("SMTP_PASS (ou SMTP_PASSWORD) manquant");
    }

    const sent: string[] = [];
    const failed: { email: string; error: string }[] = [];
    const historyRows: Record<string, unknown>[] = [];

    for (const m of members) {
      try {
        await sendOneEmail({
          to: m.email,
          subject: built.subject,
          text: built.text,
          html: built.html,
        });
        sent.push(m.email);
        historyRows.push({
          publication_id: built.contentType === "publication" ? built.contentId : null,
          content_type: built.contentType,
          content_id: built.contentId,
          content_title: built.contentTitle,
          group_id: m.group_id,
          group_name: m.group_name,
          recipient_name: m.full_name,
          recipient_email: m.email,
          author_name: built.authorName,
          content_excerpt: truncate(built.content, 500),
          publication_link: built.link,
          subject: built.subject,
        });
      } catch (e) {
        failed.push({
          email: m.email,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    if (historyRows.length > 0) {
      const { error: histErr } = await supabase.from("email_notification_sends").insert(historyRows);
      if (histErr) console.error("email_notification_sends insert failed:", histErr.message);
    }

    return new Response(
      JSON.stringify({
        ok: failed.length === 0,
        category: built.contentType,
        recipients: members.length,
        smtp: { sent: sent.length, failed },
        history_logged: historyRows.length,
      }),
      {
        status: failed.length === members.length ? 500 : 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
