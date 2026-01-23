"use client";

import { GoogleAnalytics } from "./GoogleAnalytics";
import { GoogleTagManager, GoogleTagManagerNoScript } from "./GoogleTagManager";
import { MetaPixel } from "./MetaPixel";

export function Analytics() {
  return (
    <>
      <GoogleAnalytics />
      <GoogleTagManager />
      <MetaPixel />
    </>
  );
}

export function AnalyticsNoScript() {
  return <GoogleTagManagerNoScript />;
}

// Re-export tracking functions
export { trackEvent, trackPageView, trackPhoneClick, trackSearch, trackPackageView } from "./GoogleAnalytics";
export { pushToDataLayer, trackEcommerceEvent } from "./GoogleTagManager";
export { trackMetaEvent, trackMetaSearch, trackMetaViewContent, trackMetaLead, trackMetaContact } from "./MetaPixel";
