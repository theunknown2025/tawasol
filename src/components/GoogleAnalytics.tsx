import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  initGoogleAnalytics,
  isGoogleAnalyticsEnabled,
  shouldSkipGaPath,
  trackPageView,
} from "@/lib/googleAnalytics";

/**
 * Loads GA4 once and sends a page_view on each public SPA route change.
 */
export default function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (!isGoogleAnalyticsEnabled()) return;
    initGoogleAnalytics();
  }, []);

  useEffect(() => {
    if (!isGoogleAnalyticsEnabled()) return;
    if (shouldSkipGaPath(location.pathname)) return;

    const path = `${location.pathname}${location.search}`;
    trackPageView(path);
  }, [location.pathname, location.search]);

  return null;
}
