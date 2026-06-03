import DOMPurify from "dompurify";

const RICH_TEXT_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "ul",
  "ol",
  "li",
  "span",
];

const RICH_TEXT_ALLOWED_ATTR = ["style"];

export function sanitizeRichTextHtml(html: string): string {
  if (!html.trim()) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: RICH_TEXT_ALLOWED_TAGS,
    ALLOWED_ATTR: RICH_TEXT_ALLOWED_ATTR,
  });
}

export function stripRichTextHtml(html: string): string {
  if (!html.trim()) return "";
  const clean = sanitizeRichTextHtml(html);
  const tmp = document.createElement("div");
  tmp.innerHTML = clean;
  return (tmp.textContent ?? tmp.innerText ?? "").replace(/\s+/g, " ").trim();
}

export function isRichTextEmpty(html: string): boolean {
  return stripRichTextHtml(html).length === 0;
}
