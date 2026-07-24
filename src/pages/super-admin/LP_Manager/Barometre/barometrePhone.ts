/** Format MA : `+212` + 9 chiffres, ou `0` + 9 chiffres (ex. +212651381050 / 0651381050). */

export const MOROCCO_PHONE_INTL_MAX = 13; // +212 + 9
export const MOROCCO_PHONE_LOCAL_MAX = 10; // 0 + 9

const INTL_RE = /^\+212\d{9}$/;
const LOCAL_RE = /^0\d{9}$/;

export function isValidMoroccoPhone(raw: string): boolean {
  const t = raw.trim().replace(/\s+/g, "");
  return INTL_RE.test(t) || LOCAL_RE.test(t);
}

/** Normalise espaces ; conserve uniquement un format partiel ou complet autorisé. */
export function sanitizeMoroccoPhoneInput(raw: string): string {
  const cleaned = raw.replace(/\s+/g, "");
  if (!cleaned) return "";

  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1).replace(/\D/g, "");
    return (`+${digits}`).slice(0, MOROCCO_PHONE_INTL_MAX);
  }

  if (cleaned.startsWith("0")) {
    const digits = cleaned.replace(/\D/g, "");
    return digits.slice(0, MOROCCO_PHONE_LOCAL_MAX);
  }

  // Autre caractère de départ : ignorer (seul + ou 0 sont acceptés)
  return "";
}

export const MOROCCO_PHONE_HINT = "+212xxxxxxxxx ou 0xxxxxxxxx";

export const MOROCCO_PHONE_ERROR =
  `Format invalide. Utilisez ${MOROCCO_PHONE_HINT} (exactement 9 chiffres après +212 ou 0).`;
