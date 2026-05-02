/** Slug URL sûr (a-z, 0-9, tirets). */
export function slugifyTitle(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return base.length > 0 ? base : "blog";
}

export function makeBlogSlugCandidate(title: string): string {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
    : `${Date.now().toString(36)}`;
  return `${slugifyTitle(title)}-${suffix}`;
}
