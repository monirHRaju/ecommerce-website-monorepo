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
const USER_CACHE_STORAGE_KEY = "deshio_analytics_user";

export interface AnalyticsContentItem {
  id: string;
  item_name?: string;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  quantity: number;
  item_price?: number;
  discount?: number;
  index?: number;
}

export interface AnalyticsCustomData {
  value?: number;
  shipping?: number;
  tax?: number;
  discount?: number;
  currency?: string;
  coupon?: string;
  shipping_tier?: string;
  payment_type?: string;
  item_list_id?: string;
  item_list_name?: string;
  content_ids?: string[];
  content_type?: string;
  content_name?: string;
  content_category?: string;
  contents?: AnalyticsContentItem[];
  num_items?: number;
  order_id?: string;
  search_string?: string;
  method?: string;
}

export interface AnalyticsUserData {
  email?: string;
  phone?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  thana?: string;
  street?: string;
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
  /** If true, skips forwarding to `/api/v1/tracking/event` */
  skipServerForward?: boolean;
}

/**
 * Generates a unique `event_id` shared by Browser Pixel, GTM DataLayer, and Server CAPI for deduplication.
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
 * Normalizes a Bangladesh phone number into E.164 (`+8801XXXXXXXXX`) for GTM / GA4 / Meta matching.
 */
export function normalizePhoneForAnalytics(raw?: string): string | undefined {
  if (!raw) return undefined;
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("8801") && digits.length === 13) {
    return `+${digits}`;
  }
  if (digits.startsWith("01") && digits.length === 11) {
    return `+88${digits}`;
  }
  if (digits.startsWith("1") && digits.length === 10) {
    return `+880${digits}`;
  }
  return `+${digits}`;
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
 * Caches known customer details in sessionStorage so subsequent funnel events
 * include `user_data` in `window.dataLayer` for GTM Enhanced Conversions & Server CAPI.
 */
export function resolveAndCacheUserData(input?: AnalyticsUserData): Record<string, any> {
  if (typeof window === "undefined") return {};

  let cached: AnalyticsUserData = {};
  try {
    const raw = sessionStorage.getItem(USER_CACHE_STORAGE_KEY);
    if (raw) cached = JSON.parse(raw);
  } catch {
    // ignore storage errors
  }

  // Also check if logged-in user is stored in localStorage
  try {
    const storedUserRaw = localStorage.getItem("user");
    if (storedUserRaw) {
      const parsedUser = JSON.parse(storedUserRaw);
      if (parsedUser && typeof parsedUser === "object") {
        cached = {
          externalId: parsedUser._id || parsedUser.id || cached.externalId,
          email: parsedUser.email || cached.email,
          phone: parsedUser.phone || cached.phone,
          name: parsedUser.name || cached.name,
          ...cached,
        };
      }
    }
  } catch {
    // ignore
  }

  const merged: AnalyticsUserData = {
    ...cached,
    ...(input || {}),
  };

  if (input && Object.keys(input).length > 0) {
    try {
      sessionStorage.setItem(USER_CACHE_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // ignore
    }
  }

  const { fbp, fbc } = getMetaBrowserIdentifiers();
  const normalizedPhone = normalizePhoneForAnalytics(merged.phone);

  let firstName = merged.firstName;
  let lastName = merged.lastName;
  if (!firstName && merged.name) {
    const parts = merged.name.trim().split(/\s+/);
    firstName = parts[0] || undefined;
    lastName = parts.length > 1 ? parts.slice(1).join(" ") : undefined;
  }

  const cleanEmail =
    merged.email && !merged.email.endsWith("@guest.local")
      ? merged.email.trim().toLowerCase()
      : undefined;

  const userDataPayload: Record<string, any> = {};
  if (cleanEmail) {
    userDataPayload.email = cleanEmail;
    userDataPayload.email_address = cleanEmail;
  }
  if (normalizedPhone) {
    userDataPayload.phone_number = normalizedPhone;
    userDataPayload.phone = merged.phone;
  }
  if (firstName) userDataPayload.first_name = firstName;
  if (lastName) userDataPayload.last_name = lastName;
  if (merged.name) userDataPayload.full_name = merged.name.trim();
  if (merged.city) userDataPayload.city = merged.city.trim();
  if (merged.thana) userDataPayload.region = merged.thana.trim();
  if (merged.street) userDataPayload.street = merged.street.trim();
  if (merged.zip) userDataPayload.postal_code = merged.zip.trim();
  userDataPayload.country = "BD";
  if (merged.externalId) userDataPayload.external_id = String(merged.externalId);
  if (fbp) userDataPayload.fbp = fbp;
  if (fbc) userDataPayload.fbc = fbc;

  return userDataPayload;
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
 * True once every enabled provider has defined its global (fbq / gtag / ttq),
 * so initial events are not lost to script-loading race conditions.
 */
export function isTrackingReady(config?: PublicTrackingConfig | null): boolean {
  if (typeof window === "undefined" || !config) return true;
  if (
    config.metaEnabled &&
    config.metaPixelId?.trim() &&
    typeof window.fbq !== "function"
  ) {
    return false;
  }
  if (config.tiktokEnabled && config.tiktokPixelId?.trim() && !window.ttq) {
    return false;
  }
  if (
    config.gaEnabled &&
    config.gaMeasurementId?.trim() &&
    typeof window.gtag !== "function"
  ) {
    return false;
  }
  return true;
}

/**
 * Waits up to `maxWaitMs` for a third-party pixel global (`fbq`, `gtag`, `ttq`) to finish
 * initializing before invoking `callback`, so events fired on initial mount (`ViewContent`,
 * `InitiateCheckout`, `PageView`) are never dropped.
 */
function runWhenReady(
  checkFn: () => boolean,
  callback: () => void,
  maxWaitMs = 6000
): void {
  if (typeof window === "undefined") return;
  if (checkFn()) {
    try {
      callback();
    } catch {
      // ignore pixel errors
    }
    return;
  }

  let elapsed = 0;
  const intervalMs = 100;
  const timer = window.setInterval(() => {
    elapsed += intervalMs;
    if (checkFn()) {
      window.clearInterval(timer);
      try {
        callback();
      } catch {
        // ignore pixel errors
      }
    } else if (elapsed >= maxWaitMs) {
      window.clearInterval(timer);
    }
  }, intervalMs);
}

/**
 * Fires a standardized e-commerce event across:
 * 1) `window.dataLayer` (Unconditional GA4 Ecommerce + GTM + Meta/Enhanced Conversions Schema)
 * 2) Meta Browser Pixel (`fbq('track', event, data, { eventID })`)
 * 3) Direct Google Analytics 4 (`gtag('event', ...)`)
 * 4) TikTok Browser Pixel (`ttq.track`)
 * 5) Server-side Meta Conversions API (`POST /api/v1/tracking/event`) with identical `event_id`
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

  const gaEventMap: Record<TrackingEventName, string> = {
    PageView: "page_view",
    ViewItemList: "view_item_list",
    SelectItem: "select_item",
    ViewContent: "view_item",
    AddToWishlist: "add_to_wishlist",
    AddToCart: "add_to_cart",
    RemoveFromCart: "remove_from_cart",
    ViewCart: "view_cart",
    InitiateCheckout: "begin_checkout",
    AddShippingInfo: "add_shipping_info",
    AddPaymentInfo: "add_payment_info",
    Purchase: "purchase",
    Search: "search",
    CompleteRegistration: "sign_up",
    Login: "login",
  };
  const gaEventName = gaEventMap[eventName] || eventName;

  const isGaEcommerceEvent =
    eventName === "ViewItemList" ||
    eventName === "SelectItem" ||
    eventName === "ViewContent" ||
    eventName === "AddToWishlist" ||
    eventName === "AddToCart" ||
    eventName === "RemoveFromCart" ||
    eventName === "ViewCart" ||
    eventName === "InitiateCheckout" ||
    eventName === "AddShippingInfo" ||
    eventName === "AddPaymentInfo" ||
    eventName === "Purchase";

  const gaItems = (customData.contents || []).map((c, idx) => {
    const item: Record<string, any> = {
      item_id: String(c.id),
      item_name: String(c.item_name || customData.content_name || c.id),
      item_brand: String(c.item_brand || "Deshio"),
      price: Number((c.item_price ?? 0).toFixed(2)),
      quantity: Number(c.quantity ?? 1),
      currency: customData.currency || "BDT",
    };
    if (c.item_category || customData.content_category) {
      item.item_category = String(c.item_category || customData.content_category);
    }
    if (c.item_variant) {
      item.item_variant = String(c.item_variant);
    }
    if (c.discount !== undefined && c.discount > 0) {
      item.discount = Number(c.discount.toFixed(2));
    }
    item.index = c.index !== undefined ? c.index : idx;
    return item;
  });

  const resolvedContentIds =
    customData.content_ids && customData.content_ids.length > 0
      ? customData.content_ids
      : gaItems.map((i) => i.item_id);

  const resolvedNumItems =
    customData.num_items !== undefined
      ? customData.num_items
      : (customData.contents || []).reduce((acc, c) => acc + (c.quantity || 1), 0);

  // Sanitized payload for Meta Pixel & Meta Conversions API
  const metaCustomData: AnalyticsCustomData = {
    value:
      customData.value !== undefined
        ? Number(customData.value.toFixed(2))
        : undefined,
    currency: customData.currency || "BDT",
    content_ids: resolvedContentIds.length > 0 ? resolvedContentIds : undefined,
    content_type:
      customData.content_type || (gaItems.length > 0 ? "product" : undefined),
    content_name: customData.content_name || gaItems[0]?.item_name,
    content_category: customData.content_category || gaItems[0]?.item_category,
    contents: customData.contents?.map((c) => ({
      id: String(c.id),
      quantity: Number(c.quantity ?? 1),
      item_price:
        c.item_price !== undefined ? Number(c.item_price.toFixed(2)) : undefined,
    })),
    num_items: resolvedNumItems > 0 ? resolvedNumItems : undefined,
    order_id: customData.order_id || options.orderNumber,
    search_string: customData.search_string,
  };

  const userDataForDataLayer = resolveAndCacheUserData(options.userData);

  const pageParams = {
    page_location: window.location.href,
    page_path: window.location.pathname + window.location.search,
    page_title: document.title,
  };

  // ── 1. UNCONDITIONAL Google Tag Manager / GA4 Standard Data Layer Push ───────
  // Always pushes to `window.dataLayer` so GTM Preview, Tag Assistant, DataSlayer,
  // and any GTM tags (GA4, Meta Pixel, Meta CAPI, TikTok) work out of the box.
  try {
    window.dataLayer = window.dataLayer || [];

    if (isGaEcommerceEvent) {
      // Clear previous ecommerce object per Google's official GA4 GTM standard
      window.dataLayer.push({ ecommerce: null });

      const ecommerceObject: Record<string, any> = {
        currency: customData.currency || "BDT",
        value: Number((customData.value ?? 0).toFixed(2)),
        items: gaItems,
      };

      if (customData.coupon) {
        ecommerceObject.coupon = customData.coupon;
      }
      if (customData.item_list_id) {
        ecommerceObject.item_list_id = customData.item_list_id;
      }
      if (customData.item_list_name) {
        ecommerceObject.item_list_name = customData.item_list_name;
      }
      if (customData.shipping_tier) {
        ecommerceObject.shipping_tier = customData.shipping_tier;
      }
      if (customData.payment_type) {
        ecommerceObject.payment_type = customData.payment_type;
      }

      if (gaEventName === "purchase") {
        ecommerceObject.transaction_id = String(
          customData.order_id || options.orderNumber || options.orderId || ""
        );
        ecommerceObject.shipping = Number((customData.shipping ?? 0).toFixed(2));
        ecommerceObject.tax = Number((customData.tax ?? 0).toFixed(2));
      }

      window.dataLayer.push({
        event: gaEventName,
        event_id: eventId,
        ecommerce: ecommerceObject,
        // Top-level Meta & GTM variables for easy Data Layer Variable mapping
        content_ids: metaCustomData.content_ids,
        content_type: metaCustomData.content_type,
        content_name: metaCustomData.content_name,
        content_category: metaCustomData.content_category,
        contents: metaCustomData.contents,
        num_items: metaCustomData.num_items,
        value: ecommerceObject.value,
        currency: ecommerceObject.currency,
        order_id: ecommerceObject.transaction_id,
        user_data: userDataForDataLayer,
      });
    } else if (eventName === "PageView") {
      window.dataLayer.push({
        event: "page_view",
        event_id: eventId,
        ...pageParams,
        user_data: userDataForDataLayer,
      });
    } else if (eventName === "Search") {
      window.dataLayer.push({
        event: "search",
        event_id: eventId,
        search_term: customData.search_string,
        search_string: customData.search_string,
        user_data: userDataForDataLayer,
      });
    } else if (eventName === "CompleteRegistration") {
      window.dataLayer.push({
        event: "sign_up",
        event_id: eventId,
        method: customData.method || "phone_or_email",
        user_data: userDataForDataLayer,
      });
    } else if (eventName === "Login") {
      window.dataLayer.push({
        event: "login",
        event_id: eventId,
        method: customData.method || "phone_or_email",
        user_data: userDataForDataLayer,
      });
    }
  } catch {
    // ignore dataLayer errors
  }

  // ── 2. Meta Browser Pixel (`fbq`) with eventID deduplication & readiness queue ─
  const metaStandardEventMap: Partial<Record<TrackingEventName, string>> = {
    PageView: "PageView",
    ViewContent: "ViewContent",
    AddToWishlist: "AddToWishlist",
    AddToCart: "AddToCart",
    InitiateCheckout: "InitiateCheckout",
    AddPaymentInfo: "AddPaymentInfo",
    Purchase: "Purchase",
    Search: "Search",
    CompleteRegistration: "CompleteRegistration",
  };
  const metaEventName = metaStandardEventMap[eventName];

  if (metaEventName && (config?.metaEnabled ?? true)) {
    const hasPixelConfigured = Boolean(
      config?.metaPixelId?.trim() || typeof window.fbq === "function"
    );
    if (hasPixelConfigured) {
      runWhenReady(
        () => typeof window.fbq === "function",
        () => {
          window.fbq!("track", metaEventName, metaCustomData, { eventID: eventId });
        }
      );
    }
  }

  // ── 3. Direct Google Analytics 4 (`gtag.js`) with readiness queue ────────────
  if (config?.gaEnabled && config?.gaMeasurementId?.trim()) {
    runWhenReady(
      () => typeof window.gtag === "function",
      () => {
        const params: Record<string, any> = { event_id: eventId };
        if (eventName === "PageView") {
          Object.assign(params, pageParams);
        } else if (eventName === "Search") {
          params.search_term = customData.search_string;
        } else if (eventName === "CompleteRegistration" || eventName === "Login") {
          params.method = customData.method || "phone_or_email";
        } else if (isGaEcommerceEvent) {
          params.currency = customData.currency || "BDT";
          params.value = Number((customData.value ?? 0).toFixed(2));
          params.items = gaItems;
          if (customData.coupon) params.coupon = customData.coupon;
          if (customData.item_list_id) params.item_list_id = customData.item_list_id;
          if (customData.item_list_name) params.item_list_name = customData.item_list_name;
          if (customData.shipping_tier) params.shipping_tier = customData.shipping_tier;
          if (customData.payment_type) params.payment_type = customData.payment_type;
          if (eventName === "Purchase") {
            params.transaction_id = String(
              customData.order_id || options.orderNumber || options.orderId || ""
            );
            params.shipping = Number((customData.shipping ?? 0).toFixed(2));
            params.tax = Number((customData.tax ?? 0).toFixed(2));
          }
        }
        window.gtag!("event", gaEventName, params);
      }
    );
  }

  // ── 4. TikTok Browser Pixel (`ttq`) with readiness queue ─────────────────────
  if (config?.tiktokEnabled && config?.tiktokPixelId?.trim()) {
    const ttEventMap: Partial<Record<TrackingEventName, string>> = {
      ViewContent: "ViewContent",
      AddToWishlist: "AddToWishlist",
      AddToCart: "AddToCart",
      InitiateCheckout: "InitiateCheckout",
      AddPaymentInfo: "AddPaymentInfo",
      Purchase: "CompletePayment",
      Search: "Search",
      CompleteRegistration: "CompleteRegistration",
    };
    const ttEvent = ttEventMap[eventName];

    runWhenReady(
      () => Boolean(window.ttq && typeof window.ttq.track === "function"),
      () => {
        if (eventName === "PageView" && typeof window.ttq.page === "function") {
          window.ttq.page();
        }
        if (ttEvent) {
          window.ttq.track(
            ttEvent,
            {
              value: metaCustomData.value,
              currency: customData.currency || "BDT",
              content_id: resolvedContentIds[0],
              content_type: customData.content_type || "product",
              content_name: metaCustomData.content_name,
              quantity: resolvedNumItems || 1,
              query: customData.search_string,
            },
            { event_id: eventId }
          );
        }
      }
    );
  }

  // ── 5. Server-side Conversions API forwarder ─────────────────────────────────
  const isCapiSupportedEvent = Boolean(metaStandardEventMap[eventName]);
  if (
    isCapiSupportedEvent &&
    !options.skipServerForward &&
    (config?.metaCapiEnabled ?? true)
  ) {
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
          email: userDataForDataLayer.email,
          phone: userDataForDataLayer.phone_number || userDataForDataLayer.phone,
          name: userDataForDataLayer.full_name,
          firstName: userDataForDataLayer.first_name,
          lastName: userDataForDataLayer.last_name,
          city: userDataForDataLayer.city,
          zip: userDataForDataLayer.postal_code,
          country: "bd",
          externalId: userDataForDataLayer.external_id,
          fbp,
          fbc,
        },
        customData: metaCustomData,
      }),
    }).catch(() => {});
  }

  return eventId;
}
