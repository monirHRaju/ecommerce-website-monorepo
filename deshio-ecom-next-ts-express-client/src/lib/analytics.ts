"use client";

import { API_BASE } from "@/lib/api";
import { PublicTrackingConfig, TrackingEventName } from "@/lib/settings";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    ttq?: any;
    __DESHIO_TRACKING_CONFIG__?: PublicTrackingConfig | null;
  }
}

export const CONSENT_STORAGE_KEY = "deshio_cookie_consent";

export interface AnalyticsCustomData {
  value?: number;
  shipping?: number;
  tax?: number;
  currency?: string;
  content_ids?: string[];
  content_type?: string;
  content_name?: string;
  content_category?: string;
  contents?: Array<{
    id: string;
    item_name?: string;
    quantity: number;
    item_price?: number;
  }>;
  num_items?: number;
  order_id?: string;
  search_string?: string;
}

export interface AnalyticsUserData {
  email?: string;
  phone?: string;
  name?: string;
  city?: string;
  zip?: string;
  country?: string;
  externalId?: string;
}

export interface TrackEventOptions {
  eventId?: string;
  customData?: AnalyticsCustomData;
  userData?: AnalyticsUserData;
  orderId?: string;
  orderNumber?: string;
  /** If true, skips forwarding to `/api/v1/tracking/event` (used when Purchase CAPI is fired directly by order creation endpoint) */
  skipServerForward?: boolean;
}

/**
 * Generates a unique `event_id` shared by Browser Pixel and Server CAPI for deduplication.
 */
export function generateEventId(prefix = "evt"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Reads a cookie by name in the browser.
 */
export function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([$?*|{}\]\\^])/g, "\\$1") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Captures `fbclid` from URL query string into `_fbc` cookie if not already present,
 * and returns `{ fbp, fbc }` for Meta CAPI user matching.
 */
export function getMetaBrowserIdentifiers(): { fbp?: string; fbc?: string } {
  if (typeof window === "undefined") return {};

  let fbp = getCookie("_fbp");
  let fbc = getCookie("_fbc");

  try {
    const url = new URL(window.location.href);
    const fbclid = url.searchParams.get("fbclid");
    if (fbclid && !fbc) {
      fbc = `fb.1.${Date.now()}.${fbclid}`;
      document.cookie = `_fbc=${encodeURIComponent(fbc)}; path=/; max-age=${
        90 * 24 * 60 * 60
      }; SameSite=Lax`;
    }
  } catch {
    // ignore URL parse errors
  }

  return { fbp, fbc };
}

/**
 * Checks whether tracking is permitted given the current cookie consent settings.
 */
export function hasTrackingConsent(config?: PublicTrackingConfig | null): boolean {
  if (typeof window === "undefined") return false;
  const activeConfig = config ?? window.__DESHIO_TRACKING_CONFIG__;
  if (!activeConfig?.requireCookieConsent) {
    return true;
  }
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    return stored === "granted";
  } catch {
    return true;
  }
}

/**
 * Fires a standardized e-commerce event across:
 * 1) Meta Browser Pixel (`fbq('track', event, data, { eventID })`)
 * 2) Google Analytics 4 / GTM (`gtag` / `dataLayer`)
 * 3) TikTok Browser Pixel (`ttq.track`)
 * 4) Server-side Meta Conversions API (`POST /api/v1/tracking/event`) with identical `event_id`
 */
export function trackEvent(
  eventName: TrackingEventName,
  options: TrackEventOptions = {}
): string {
  const eventId = options.eventId || generateEventId(eventName.toLowerCase());
  if (typeof window === "undefined") return eventId;

  const config = window.__DESHIO_TRACKING_CONFIG__;
  if (!hasTrackingConsent(config)) {
    return eventId;
  }

  if (config?.events && config.events[eventName] === false) {
    return eventId;
  }

  const customData: AnalyticsCustomData = {
    currency: "BDT",
    ...(options.customData || {}),
  };

  // Sanitized payload for Meta Pixel & Meta Conversions API
  const metaCustomData: AnalyticsCustomData = {
    value: customData.value,
    currency: customData.currency || "BDT",
    content_ids: customData.content_ids,
    content_type: customData.content_type,
    content_name: customData.content_name,
    content_category: customData.content_category,
    contents: customData.contents?.map((c) => ({
      id: c.id,
      quantity: c.quantity,
      item_price: c.item_price,
    })),
    num_items: customData.num_items,
    order_id: customData.order_id,
    search_string: customData.search_string,
  };

  // 1. Meta Browser Pixel with eventID deduplication
  if (typeof window.fbq === "function" && (config?.metaEnabled ?? true)) {
    try {
      window.fbq("track", eventName, metaCustomData, { eventID: eventId });
    } catch {
      // ignore pixel errors
    }
  }

  // 2. Google Analytics 4 / Google Tag Manager (GA4 Ecommerce Data Layer Schema)
  const gaEventMap: Record<TrackingEventName, string> = {
    PageView: "page_view",
    ViewContent: "view_item",
    AddToCart: "add_to_cart",
    InitiateCheckout: "begin_checkout",
    AddPaymentInfo: "add_payment_info",
    Purchase: "purchase",
    Search: "search",
    CompleteRegistration: "sign_up",
  };
  const gaEventName = gaEventMap[eventName] || eventName;

  const isGaEcommerceEvent =
    eventName === "ViewContent" ||
    eventName === "AddToCart" ||
    eventName === "InitiateCheckout" ||
    eventName === "AddPaymentInfo" ||
    eventName === "Purchase";

  const gaItems = (customData.contents || []).map((c) => ({
    item_id: String(c.id),
    item_name: String(c.item_name || customData.content_name || c.id),
    price: Number((c.item_price ?? 0).toFixed(2)),
    quantity: Number(c.quantity ?? 1),
  }));

  if (isGaEcommerceEvent) {
    try {
      window.dataLayer = window.dataLayer || [];
      // Clear previous ecommerce object per GA4 GTM best practices
      window.dataLayer.push({ ecommerce: null });

      if (gaEventName === "purchase") {
        window.dataLayer.push({
          event: "purchase",
          ecommerce: {
            transaction_id: String(
              customData.order_id || options.orderNumber || options.orderId || ""
            ),
            value: Number((customData.value ?? 0).toFixed(2)),
            shipping: Number((customData.shipping ?? 0).toFixed(2)),
            tax: Number((customData.tax ?? 0).toFixed(2)),
            currency: customData.currency || "BDT",
            items: gaItems,
          },
        });
      } else {
        window.dataLayer.push({
          event: gaEventName,
          ecommerce: {
            currency: customData.currency || "BDT",
            value: Number((customData.value ?? 0).toFixed(2)),
            items: gaItems,
          },
        });
      }
    } catch {
      // ignore dataLayer errors
    }
  }

  // Direct gtag.js fallback (when GA4 Measurement ID is configured directly without GTM)
  if (typeof window.gtag === "function" && config?.gaEnabled) {
    try {
      window.gtag("event", gaEventName, {
        event_id: eventId,
        currency: customData.currency || "BDT",
        value:
          customData.value !== undefined
            ? Number(customData.value.toFixed(2))
            : undefined,
        transaction_id: customData.order_id || options.orderNumber,
        shipping:
          customData.shipping !== undefined
            ? Number(customData.shipping.toFixed(2))
            : undefined,
        tax:
          customData.tax !== undefined
            ? Number(customData.tax.toFixed(2))
            : undefined,
        search_term: customData.search_string,
        items: gaItems.length > 0 ? gaItems : undefined,
      });
    } catch {
      // ignore gtag errors
    }
  }

  // 3. TikTok Pixel
  if (window.ttq && typeof window.ttq.track === "function" && config?.tiktokEnabled) {
    try {
      const ttEventMap: Partial<Record<TrackingEventName, string>> = {
        ViewContent: "ViewContent",
        AddToCart: "AddToCart",
        InitiateCheckout: "InitiateCheckout",
        AddPaymentInfo: "AddPaymentInfo",
        Purchase: "CompletePayment",
        Search: "Search",
        CompleteRegistration: "CompleteRegistration",
      };
      const ttEvent = ttEventMap[eventName];
      if (ttEvent) {
        window.ttq.track(
          ttEvent,
          {
            value: customData.value,
            currency: customData.currency || "BDT",
            content_id: customData.content_ids?.[0],
            content_type: customData.content_type || "product",
            content_name: customData.content_name,
            quantity: customData.num_items,
            query: customData.search_string,
          },
          { event_id: eventId }
        );
      }
    } catch {
      // ignore tiktok errors
    }
  }

  // 4. Server-side Conversions API forwarder (unless skipped because Order API handles it directly)
  if (!options.skipServerForward && (config?.metaCapiEnabled ?? true)) {
    const { fbp, fbc } = getMetaBrowserIdentifiers();
    fetch(`${API_BASE}/tracking/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        eventName,
        eventId,
        eventSourceUrl: window.location.href,
        orderId: options.orderId,
        orderNumber: options.orderNumber,
        userData: {
          ...(options.userData || {}),
          fbp,
          fbc,
        },
        customData: metaCustomData,
      }),
    }).catch(() => {});
  }

  return eventId;
}
