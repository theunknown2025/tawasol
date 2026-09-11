const MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID ?? "").toString().trim();

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let initialized = false;

export function isGoogleAnalyticsEnabled(): boolean {
  return MEASUREMENT_ID.length > 0;
}

/** Skip internal app areas so public traffic stays clean in reports. */
export function shouldSkipGaPath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/member") ||
    pathname.startsWith("/super-admin")
  );
}

export function initGoogleAnalytics(): void {
  if (initialized || !isGoogleAnalyticsEnabled() || typeof document === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag("js", new Date());
  window.gtag("config", MEASUREMENT_ID, {
    send_page_view: false,
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  initialized = true;
}

export function trackPageView(path: string): void {
  if (!isGoogleAnalyticsEnabled() || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}
