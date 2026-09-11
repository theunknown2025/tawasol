/** Truncate a description to the first `maxWords` words (adds an ellipsis when truncated). */
export function previewFirstWords(text: string, maxWords = 10): { preview: string; truncated: boolean } {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { preview: "", truncated: false };
  }
  if (words.length <= maxWords) {
    return { preview: words.join(" "), truncated: false };
  }
  return { preview: `${words.slice(0, maxWords).join(" ")}…`, truncated: true };
}

export function externalPartnerHref(url: string): string | null {
  const t = url.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, "")}`;
}
