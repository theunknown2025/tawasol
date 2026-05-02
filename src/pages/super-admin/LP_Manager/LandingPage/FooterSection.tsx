import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import type { FooterContent, FooterSocialKey } from "../types";

type FooterSectionProps = {
  content: FooterContent;
};

function socialIcon(key: FooterSocialKey) {
  if (key === "facebook") return Facebook;
  if (key === "linkedin") return Linkedin;
  if (key === "instagram") return Instagram;
  if (key === "youtube") return Youtube;
  return null;
}

export function FooterSection({ content }: FooterSectionProps) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-muted/30">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          {content.logoUrl.trim() ? (
            <img
              src={content.logoUrl}
              alt="Logo footer"
              className="h-12 w-auto max-w-[180px] object-contain"
              loading="lazy"
            />
          ) : null}
          {content.shortText.trim() ? (
            <p className="text-sm leading-6 text-muted-foreground">{content.shortText}</p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            {content.socialLinks
              .filter((item) => item.url.trim().length > 0)
              .map((item) => {
                const Icon = socialIcon(item.key);
                return (
                  <a
                    key={item.key}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-primary"
                    aria-label={item.label}
                    title={item.label}
                  >
                    {Icon ? <Icon className="h-4 w-4" aria-hidden /> : <span className="text-xs">X</span>}
                  </a>
                );
              })}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">
            Navigation rapide
          </h3>
          <ul className="space-y-2">
            {content.quickNavigation.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {content.elementsColumns.map((col, index) => (
          <div key={`${col.title}-${index}`}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">{col.title}</h3>
            <ul className="space-y-2">
              {col.items.map((item) => (
                <li key={item} className="text-sm text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/70 px-4 py-4 text-center text-xs text-muted-foreground">
        © {year} {content.copyrightText}
      </div>
    </footer>
  );
}
