export function buildLinkedInShareUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

export function buildWhatsAppShareUrl(text: string, url: string): string {
  const body = text.trim() ? `${text.trim()}\n\n${url}` : url;
  return `https://wa.me/?text=${encodeURIComponent(body)}`;
}

export function buildMailtoShareUrl(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function getPublicOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin.replace(/\/$/, "");
}

/** Page dédiée lecture / avis (remplace l’ancien lien bibliothèque + query). */
export function buildArticleShareUrl(bookId: string): string {
  const origin = getPublicOrigin();
  if (!origin) return `/article/${encodeURIComponent(bookId)}`;
  return `${origin}/article/${encodeURIComponent(bookId)}`;
}

/** @deprecated Utilisez `buildArticleShareUrl` — conservé pour compatibilité éventuelle. */
export function buildLibraryBookShareUrl(bookId: string): string {
  return buildArticleShareUrl(bookId);
}

export function buildEventShareUrl(slug: string): string {
  const origin = getPublicOrigin();
  if (!origin) return `/event/${encodeURIComponent(slug)}`;
  return `${origin}/event/${encodeURIComponent(slug)}`;
}

export function buildBlogShareUrl(slug: string): string {
  const origin = getPublicOrigin();
  if (!origin) return `/blog/${encodeURIComponent(slug)}`;
  return `${origin}/blog/${encodeURIComponent(slug)}`;
}
