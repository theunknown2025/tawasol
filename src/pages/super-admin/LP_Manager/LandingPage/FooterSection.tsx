import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUp,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  Phone,
  Youtube,
} from "lucide-react";
import { LANDING_PAGE_SECTION_ANCHOR_ID } from "./landingPageSectionAnchors";
import type {
  ContacterNousContent,
  FooterContent,
  FooterSocialKey,
} from "../types";

type FooterSectionProps = {
  content: FooterContent;
  contact?: ContacterNousContent;
};

const linkClass =
  "text-sm text-[hsl(35_30%_78%)] transition-colors hover:text-[hsl(37_93%_65%)]";

function socialIcon(key: FooterSocialKey) {
  if (key === "facebook") return Facebook;
  if (key === "linkedin") return Linkedin;
  if (key === "instagram") return Instagram;
  if (key === "youtube") return Youtube;
  if (key === "x") return XSocialIcon;
  return null;
}

function XSocialIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.894L1.25 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function scrollToLandingSection(anchorId: string) {
  const el = document.getElementById(anchorId);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `/#${anchorId}`);
  return true;
}

function FooterNavLink({
  href,
  children,
  className = linkClass,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const trimmed = href.trim() || "#";

  if (trimmed.startsWith("#")) {
    const anchorId = trimmed.slice(1);
    return (
      <a
        href={trimmed}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          if (!anchorId) return;
          if (location.pathname === "/") {
            if (scrollToLandingSection(anchorId)) return;
          }
          navigate({ pathname: "/", hash: anchorId });
        }}
      >
        {children}
      </a>
    );
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return (
      <Link to={trimmed} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={trimmed} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}

function telHref(phone: string): string | null {
  const t = phone.replace(/[^\d+]/g, "").trim();
  if (!t) return null;
  return `tel:${t}`;
}

function whatsappHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

function mailtoHref(email: string): string | null {
  const t = email.trim();
  if (!t) return null;
  return `mailto:${encodeURIComponent(t)}`;
}

export function FooterSection({ content, contact }: FooterSectionProps) {
  const year = new Date().getFullYear();
  const email = contact?.email?.trim() ?? "";
  const phone = contact?.phone?.trim() ?? "";
  const whatsapp = contact?.whatsapp?.trim() ?? "";
  const mailLink = mailtoHref(email);
  const phoneLink = telHref(phone);
  const waLink = whatsappHref(whatsapp);
  const hasContactBits = Boolean(mailLink || phoneLink || waLink);

  return (
    <footer className="text-[hsl(35_44%_92%)]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:px-8 lg:py-14">
        <div className="space-y-4 md:col-span-2 lg:col-span-1">
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

          {hasContactBits ? (
            <ul className="space-y-2 text-sm text-[hsl(35_30%_78%)]">
              {mailLink ? (
                <li>
                  <a href={mailLink} className={`inline-flex items-center gap-2 ${linkClass}`}>
                    <Mail className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                    <span className="break-all">{email}</span>
                  </a>
                </li>
              ) : null}
              {phoneLink ? (
                <li>
                  <a href={phoneLink} className={`inline-flex items-center gap-2 ${linkClass}`}>
                    <Phone className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                    {phone}
                  </a>
                </li>
              ) : null}
              {waLink ? (
                <li>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-2 ${linkClass}`}
                  >
                    <MessageCircle className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                    WhatsApp
                  </a>
                </li>
              ) : null}
              <li>
                <FooterNavLink href={`#${LANDING_PAGE_SECTION_ANCHOR_ID["Contacter nous"]}`}>
                  Voir le formulaire de contact
                </FooterNavLink>
              </li>
            </ul>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-1">
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
                    {Icon ? <Icon className="h-4 w-4" aria-hidden /> : <span className="text-xs">·</span>}
                  </a>
                );
              })}
          </div>
        </div>

        <nav aria-label="Navigation rapide">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
            Navigation rapide
          </h3>
          <ul className="space-y-2">
            {content.quickNavigation.map((item) => (
              <li key={item.id}>
                <FooterNavLink href={item.href}>{item.label}</FooterNavLink>
              </li>
            ))}
          </ul>
        </nav>

        {content.elementsColumns.map((col, index) => (
          <nav key={`${col.title}-${index}`} aria-label={col.title}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
              {col.title}
            </h3>
            <ul className="space-y-2">
              {col.items.map((item) => (
                <li key={item.id}>
                  <FooterNavLink href={item.href}>{item.label}</FooterNavLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-white/10 px-4 py-5">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 text-xs text-[hsl(35_25%_68%)] sm:flex-row lg:px-8">
          <p className="text-center sm:text-left">
            © {year} {content.copyrightText}
          </p>
          <FooterNavLink
            href={`#${LANDING_PAGE_SECTION_ANCHOR_ID.Hero}`}
            className="inline-flex items-center gap-1.5 text-xs text-[hsl(35_25%_68%)] transition-colors hover:text-[hsl(37_93%_65%)]"
          >
            <ArrowUp className="h-3.5 w-3.5" aria-hidden />
            Haut de page
          </FooterNavLink>
        </div>
      </div>
    </footer>
  );
}
