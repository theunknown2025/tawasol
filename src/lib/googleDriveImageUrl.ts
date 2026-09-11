/** Extract a Google Drive file id from common share / view / uc URLs. */
export function extractGoogleDriveFileId(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;

  const lower = url.toLowerCase();
  const looksLikeDrive =
    lower.includes("drive.google.com") ||
    lower.includes("docs.google.com") ||
    lower.includes("googleusercontent.com");
  if (!looksLikeDrive) return null;

  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?[^#]*[?&]id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?[^#]*[?&]id=([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/(?:uc|file)\/d\/([a-zA-Z0-9_-]+)/,
    /googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]{20,})/,
  ];

  for (const re of patterns) {
    const m = url.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

export function isGoogleDriveUrl(raw: string): boolean {
  return extractGoogleDriveFileId(raw) !== null;
}

/**
 * Best-effort direct image URL for a public Drive file (CSS / <img>).
 * Prefer rehosting via `importLandingPageImageFromUrl` when possible.
 */
export function googleDriveDirectImageUrl(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

export function normalizeImageSourceUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const id = extractGoogleDriveFileId(trimmed);
  if (id && (trimmed.includes("drive.google.com") || trimmed.includes("docs.google.com"))) {
    return googleDriveDirectImageUrl(id);
  }
  return trimmed;
}
