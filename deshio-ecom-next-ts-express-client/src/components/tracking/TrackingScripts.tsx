"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { PublicTrackingConfig } from "@/lib/settings";
import {
  CONSENT_STORAGE_KEY,
  getMetaBrowserIdentifiers,
  trackEvent,
} from "@/lib/analytics";
import { Cookie } from "lucide-react";

interface TrackingScriptsProps {
  config: PublicTrackingConfig | null;
}

export default function TrackingScripts({ config }: TrackingScriptsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [consentState, setConsentState] = useState<"granted" | "denied" | "pending">(
    "granted"
  );
  const [showBanner, setShowBanner] = useState(false);
  const lastTrackedUrl = useRef<string>("");

  // Sync config into window global and check stored cookie consent
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.__DESHIO_TRACKING_CONFIG__ = config;
    getMetaBrowserIdentifiers();

    if (!config?.requireCookieConsent) {
      setConsentState("granted");
      setShowBanner(false);
      return;
    }

    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored === "granted" || stored === "denied") {
        setConsentState(stored);
        setShowBanner(false);
      } else {
        setConsentState("pending");
        setShowBanner(true);
      }
    } catch {
      setConsentState("granted");
    }
  }, [config]);

  // Fire PageView on initial load and Next.js App Router route transitions
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (consentState !== "granted") return;

    const fullPath = `${pathname}${
      searchParams?.toString() ? `?${searchParams.toString()}` : ""
    }`;

    if (lastTrackedUrl.current === fullPath) return;
    lastTrackedUrl.current = fullPath;

    const timer = setTimeout(() => {
      trackEvent("PageView");
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, searchParams, consentState]);

  const handleAcceptConsent = () => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    } catch {
      // ignore
    }
    setConsentState("granted");
    setShowBanner(false);
    setTimeout(() => {
      trackEvent("PageView");
    }, 200);
  };

  const handleDeclineConsent = () => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, "denied");
    } catch {
      // ignore
    }
    setConsentState("denied");
    setShowBanner(false);
  };

  const canLoadScripts = consentState === "granted";
  const metaPixelId = config?.metaEnabled ? config.metaPixelId?.trim() : "";
  const gaMeasurementId = config?.gaEnabled ? config.gaMeasurementId?.trim() : "";
  const gtmContainerId = config?.gaEnabled ? config.gtmContainerId?.trim() : "";
  const tiktokPixelId = config?.tiktokEnabled ? config.tiktokPixelId?.trim() : "";

  return (
    <>
      {/* 1. Meta (Facebook) Browser Pixel (autoPageView disabled so trackEvent("PageView") deduplicates with CAPI) */}
      {canLoadScripts && metaPixelId && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq.disablePushState = true;
            fbq('init', '${metaPixelId}');
          `}
        </Script>
      )}

      {/* 2. Google Analytics 4 (gtag.js) */}
      {canLoadScripts && gaMeasurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
              gaMeasurementId
            )}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}', { send_page_view: false });
            `}
          </Script>
        </>
      )}

      {/* 3. Google Tag Manager (Optional) */}
      {canLoadScripts && gtmContainerId && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmContainerId}');
          `}
        </Script>
      )}

      {/* 4. TikTok Browser Pixel */}
      {canLoadScripts && tiktokPixelId && (
        <Script id="tiktok-pixel-init" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${tiktokPixelId}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}

      {/* 5. Cookie Consent Banner (when requireCookieConsent is enabled in Admin) */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 rounded-2xl bg-stone-900/95 backdrop-blur-md text-white p-5 shadow-2xl border border-stone-800 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <Cookie className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif text-sm font-semibold text-white">
                Privacy & Cookie Preferences
              </h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                {config?.consentBannerText ||
                  "We use cookies and analytics pixels to personalize your shopping experience and measure our campaigns."}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleDeclineConsent}
              className="px-3.5 py-1.5 rounded-lg border border-stone-700 text-stone-300 hover:bg-stone-800 text-xs font-medium transition-colors"
            >
              Essential Only
            </button>
            <button
              type="button"
              onClick={handleAcceptConsent}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      )}
    </>
  );
}
