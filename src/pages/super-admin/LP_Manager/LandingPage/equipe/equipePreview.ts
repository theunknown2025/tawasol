/** First N characters of bio for card hover preview. */
export function previewFirstLetters(text: string, maxLetters = 15): {
  preview: string;
  truncated: boolean;
} {
  const t = text.trim();
  if (t.length === 0) return { preview: "", truncated: false };
  if (t.length <= maxLetters) return { preview: t, truncated: false };
  return { preview: `${t.slice(0, maxLetters).trimEnd()}…`, truncated: true };
}

export function linkedinHref(url: string): string | null {
  const t = url.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, "")}`;
}

export function mailtoHref(email: string): string | null {
  const t = email.trim();
  if (!t) return null;
  return `mailto:${encodeURIComponent(t)}`;
}
