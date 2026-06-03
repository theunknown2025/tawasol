import type { CSSProperties } from "react";
import type { HeroSlideBackground } from "@/pages/super-admin/LP_Manager/types";
import { slideBackgroundStyle } from "@/pages/super-admin/LP_Manager/types";
import { supabase } from "@/lib/supabase";

export type HeroPublicationKind = "event" | "article" | "book" | "opportunity";

export type HeroPublicationSlide = {
  id: string;
  kind: HeroPublicationKind;
  kindLabel: string;
  title: string;
  href: string;
  publishedAt: Date;
  imageUrl: string | null;
  thumbnailStyle: CSSProperties;
};

const KIND_LABELS: Record<HeroPublicationKind, string> = {
  event: "Événement",
  article: "Article",
  book: "Livre",
  opportunity: "Opportunité",
};

const FALLBACK_THUMBNAIL: Record<HeroPublicationKind, CSSProperties> = {
  event: { background: "linear-gradient(135deg, #7c2d12, #b45309)" },
  article: { background: "linear-gradient(135deg, #1e3a5f, #2563eb)" },
  book: { background: "linear-gradient(135deg, #14532d, #059669)" },
  opportunity: { background: "linear-gradient(135deg, #134e4a, #0d9488)" },
};

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "")
  .toString()
  .trim()
  .replace(/\/$/, "");

function toDate(primary: string | null | undefined, fallback: string): Date {
  return new Date(primary ?? fallback);
}

function eventBannerUrl(bannerPath: string | null | undefined): string | null {
  if (!bannerPath?.trim()) return null;
  return `${supabaseUrl}/storage/v1/object/public/event-banners/${bannerPath}`;
}

function resolveOpportunityThumbnail(banner: unknown): {
  imageUrl: string | null;
  thumbnailStyle: CSSProperties;
} {
  const bg = (banner ?? { type: "solid", color: "#059669" }) as HeroSlideBackground;
  if (bg.type === "image" && bg.url.trim()) {
    return {
      imageUrl: bg.url.trim(),
      thumbnailStyle: slideBackgroundStyle({
        ...bg,
        overlayOpacity: 0,
      }),
    };
  }
  return {
    imageUrl: null,
    thumbnailStyle: slideBackgroundStyle(bg),
  };
}

export async function fetchLatestHeroPublications(): Promise<HeroPublicationSlide[]> {
  const [eventRes, blogRes, bookRes, oppRes] = await Promise.all([
    supabase
      .from("evenements")
      .select("id, titre, public_slug, banner_path, created_at, updated_at")
      .eq("status", "published")
      .not("public_slug", "is", null)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("blogs")
      .select("id, title, slug, banner, published_at, created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("lp_library_books")
      .select("id, title, cover_url, published_at, created_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("lp_opportunities")
      .select("id, title, public_slug, banner, published_at, created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (eventRes.error) throw eventRes.error;
  if (blogRes.error) throw blogRes.error;
  if (bookRes.error) throw bookRes.error;
  if (oppRes.error) throw oppRes.error;

  const slides: HeroPublicationSlide[] = [];

  const event = eventRes.data?.[0];
  if (event?.public_slug) {
    const imageUrl = eventBannerUrl(event.banner_path);
    slides.push({
      id: `event-${event.id}`,
      kind: "event",
      kindLabel: KIND_LABELS.event,
      title: event.titre,
      href: `/event/${event.public_slug}`,
      publishedAt: toDate(event.updated_at, event.created_at),
      imageUrl,
      thumbnailStyle: imageUrl ? {} : FALLBACK_THUMBNAIL.event,
    });
  }

  const blog = blogRes.data?.[0];
  if (blog?.slug) {
    const imageUrl = typeof blog.banner === "string" && blog.banner.trim() ? blog.banner.trim() : null;
    slides.push({
      id: `article-${blog.id}`,
      kind: "article",
      kindLabel: KIND_LABELS.article,
      title: blog.title,
      href: `/blog/${blog.slug}`,
      publishedAt: toDate(blog.published_at, blog.created_at),
      imageUrl,
      thumbnailStyle: imageUrl ? {} : FALLBACK_THUMBNAIL.article,
    });
  }

  const book = bookRes.data?.[0];
  if (book) {
    const imageUrl =
      typeof book.cover_url === "string" && book.cover_url.trim() ? book.cover_url.trim() : null;
    slides.push({
      id: `book-${book.id}`,
      kind: "book",
      kindLabel: KIND_LABELS.book,
      title: book.title,
      href: `/article/${book.id}`,
      publishedAt: toDate(book.published_at, book.created_at),
      imageUrl,
      thumbnailStyle: imageUrl ? {} : FALLBACK_THUMBNAIL.book,
    });
  }

  const opp = oppRes.data?.[0];
  if (opp?.public_slug) {
    const thumb = resolveOpportunityThumbnail(opp.banner);
    slides.push({
      id: `opportunity-${opp.id}`,
      kind: "opportunity",
      kindLabel: KIND_LABELS.opportunity,
      title: opp.title,
      href: `/opportunite/${opp.public_slug}`,
      publishedAt: toDate(opp.published_at, opp.created_at),
      imageUrl: thumb.imageUrl,
      thumbnailStyle: thumb.imageUrl ? {} : thumb.thumbnailStyle,
    });
  }

  return slides.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}
