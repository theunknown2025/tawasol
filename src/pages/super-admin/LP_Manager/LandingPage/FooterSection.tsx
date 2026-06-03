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
    <footer className="text-[hsl(35_44%_92%)]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 md:grid-cols-2 lg:grid-cols-4 lg:px-8 lg:py-14">
        <div className="space-y-4">
          {content.logoUrl.trim() ? (
            <img
              src={content.logoUrl}
              alt="Logo footer"
              className="h-12 w-auto max-w-[180px] object-contain brightness-110"
              loading="lazy"
            />
          ) : null}
          {content.shortText.trim() ? (
            <p className="text-sm leading-6 text-[hsl(35_30%_78%)]">{content.shortText}</p>
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
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-[hsl(35_44%_88%)] transition-colors hover:border-[hsl(37_93%_49%/0.6)] hover:bg-[hsl(37_93%_49%/0.15)] hover:text-[hsl(37_93%_65%)]"
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
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
            Navigation rapide
          </h3>
          <ul className="space-y-2">
            {content.quickNavigation.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  className="text-sm text-[hsl(35_30%_78%)] transition-colors hover:text-[hsl(37_93%_65%)]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {content.elementsColumns.map((col, index) => (
          <div key={`${col.title}-${index}`}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">{col.title}</h3>
            <ul className="space-y-2">
              {col.items.map((item) => (
                <li key={item} className="text-sm text-[hsl(35_30%_78%)]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-[hsl(35_25%_68%)]">
        © {year} {content.copyrightText}
      </div>
    </footer>
  );
}
