"use client";

import { API_BASE } from "@/lib/api";
import { PublicTrackingConfig, TrackingEventName } from "@/lib/settings";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    google_tag_manager?: Record<string, any>;
    ttq?: any;
    __DESHIO_TRACKING_CONFIG__?: PublicTrackingConfig | null;
    __DESHIO_RECENT_EVENTS__?: Record<string, { eventId: string; timestamp: number }>;
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
 * Detects whether a Google Tag Manager (GTM-XXXX) container is configured or active on the page.
 * When GTM is active, GTM manages browser tags (Meta Pixel, GA4, TikTok) via `window.dataLayer`,
 * so we must NOT also fire direct `window.fbq` / `window.gtag` calls (which would double-count).
 */
export function isGtmActiveOnPage(config?: PublicTrackingConfig | null): boolean {
  if (typeof window === "undefined") return false;
  const activeConfig = config ?? window.__DESHIO_TRACKING_CONFIG__;
  if (activeConfig?.gtmContainerId?.trim() || process.env.NEXT_PUBLIC_GTM_ID?.trim()) {
    return true;
  }
  if (
    window.google_tag_manager &&
    Object.keys(window.google_tag_manager).some((k) => k.toUpperCase().startsWith("GTM-"))
  ) {
    return true;
  }
  if (
    Array.isArray(window.dataLayer) &&
    window.dataLayer.some(
      (item) => item && typeof item === "object" && "gtm.start" in item
    )
  ) {
    return true;
  }
  return false;
}

/**
 * True once every enabled direct provider has defined its global (fbq / gtag / ttq).
 */
export function isTrackingReady(config?: PublicTrackingConfig | null): boolean {
  if (typeof window === "undefined" || !config) return true;
  if (isGtmActiveOnPage(config)) return true;
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
 * initializing before invoking `callback`.
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
 * Window-level deduplication guard so React Strict Mode, Suspense remounts,
 * or rapid state updates never fire the same event twice for a single user action.
 */
function checkDuplicateEvent(
  eventName: TrackingEventName,
  options: TrackEventOptions,
  contentIds: string[]
): string | null {
  if (typeof window === "undefined") return null;
  window.__DESHIO_RECENT_EVENTS__ = window.__DESHIO_RECENT_EVENTS__ || {};

  const path = `${window.location.pathname}${window.location.search}`;
  const customData = options.customData || {};
  const idsKey = contentIds.slice(0, 10).join(",");

  let signature = `${eventName}:${path}`;
  let cooldownMs = 1200;

  switch (eventName) {
    case "PageView":
      signature = `PageView:${path}`;
      cooldownMs = 1500;
      break;
    case "ViewContent":
      signature = `ViewContent:${path}:${idsKey}`;
      cooldownMs = 2500;
      break;
    case "InitiateCheckout":
      signature = `InitiateCheckout:${path}`;
      cooldownMs = 3000;
      break;
    case "ViewCart":
      signature = `ViewCart:${idsKey}:${customData.value ?? 0}`;
      cooldownMs = 2500;
      break;
    case "ViewItemList":
      signature = `ViewItemList:${customData.item_list_id || path}:${idsKey}`;
      cooldownMs = 2500;
      break;
    case "Purchase":
      signature = `Purchase:${
        options.orderNumber || customData.order_id || options.orderId || options.eventId || ""
      }`;
      cooldownMs = 60000;
      break;
    default:
      signature = `${eventName}:${idsKey}:${customData.value ?? ""}:${
        customData.search_string ?? ""
      }`;
      cooldownMs = 1000;
      break;
  }

  const now = Date.now();
  const prev = window.__DESHIO_RECENT_EVENTS__[signature];
  if (prev && now - prev.timestamp < cooldownMs) {
    return prev.eventId;
  }

  return null;
}

function recordDispatchedEvent(
  eventName: TrackingEventName,
  options: TrackEventOptions,
  contentIds: string[],
  eventId: string
): void {
  if (typeof window === "undefined") return;
  window.__DESHIO_RECENT_EVENTS__ = window.__DESHIO_RECENT_EVENTS__ || {};

  const path = `${window.location.pathname}${window.location.search}`;
  const customData = options.customData || {};
  const idsKey = contentIds.slice(0, 10).join(",");

  let signature = `${eventName}:${path}`;
  switch (eventName) {
    case "PageView":
      signature = `PageView:${path}`;
      break;
    case "ViewContent":
      signature = `ViewContent:${path}:${idsKey}`;
      break;
    case "InitiateCheckout":
      signature = `InitiateCheckout:${path}`;
      break;
    case "ViewCart":
      signature = `ViewCart:${idsKey}:${customData.value ?? 0}`;
      break;
    case "ViewItemList":
      signature = `ViewItemList:${customData.item_list_id || path}:${idsKey}`;
      break;
    case "Purchase":
      signature = `Purchase:${
        options.orderNumber || customData.order_id || options.orderId || options.eventId || ""
      }`;
      break;
    default:
      signature = `${eventName}:${idsKey}:${customData.value ?? ""}:${
        customData.search_string ?? ""
      }`;
      break;
  }

  window.__DESHIO_RECENT_EVENTS__[signature] = {
    eventId,
    timestamp: Date.now(),
  };
}

/**
 * Fires a standardized e-commerce event:
 * - Always pushes once to `window.dataLayer` (for GTM tags: Meta Pixel, GA4, TikTok, etc.).
 * - When GTM is NOT active on the page, dispatches directly to `window.fbq`, `window.gtag`, and `window.ttq`.
 * - When GTM IS active, skips direct `fbq`/`gtag`/`ttq` calls so GTM tags never double-fire.
 * - Forwards to Server-side Meta Conversions API (`POST /api/v1/tracking/event`) with identical `event_id`.
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

  // Deduplication guard against React Strict Mode / remounts / double-clicks
  const duplicateEventId = checkDuplicateEvent(eventName, options, resolvedContentIds);
  if (duplicateEventId) {
    return duplicateEventId;
  }
  recordDispatchedEvent(eventName, options, resolvedContentIds, eventId);

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

  // ── 1. Google Tag Manager / GA4 Standard Data Layer Push (Strictly Once) ────
  try {
    window.dataLayer = window.dataLayer || [];

    if (isGaEcommerceEvent) {
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

  // Check if GTM is active on the page. When GTM is active, GTM triggers Meta Pixel,
  // GA4, and TikTok tags from the `window.dataLayer` push above — so skipping direct
  // browser calls here prevents duplicate (2x) events on a single click.
  const gtmManagesBrowserTags = isGtmActiveOnPage(config);

  // ── 2. Direct Meta Browser Pixel (`fbq`) — only when GTM is NOT active ──────
  const directMetaPixelId =
    config?.metaPixelId?.trim() || process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  if (
    !gtmManagesBrowserTags &&
    metaEventName &&
    (config?.metaEnabled ?? true) &&
    directMetaPixelId
  ) {
    runWhenReady(
      () => typeof window.fbq === "function" && !isGtmActiveOnPage(config),
      () => {
        window.fbq!("track", metaEventName, metaCustomData, { eventID: eventId });
      }
    );
  }

  // ── 3. Direct Google Analytics 4 (`gtag.js`) — only when GTM is NOT active ──
  const directGaId =
    config?.gaMeasurementId?.trim() ||
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (!gtmManagesBrowserTags && config?.gaEnabled && directGaId) {
    runWhenReady(
      () => typeof window.gtag === "function" && !isGtmActiveOnPage(config),
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

  // ── 4. Direct TikTok Browser Pixel (`ttq`) — only when GTM is NOT active ────
  const directTiktokId =
    config?.tiktokPixelId?.trim() || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID?.trim();
  if (!gtmManagesBrowserTags && config?.tiktokEnabled && directTiktokId) {
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
      () =>
        Boolean(window.ttq && typeof window.ttq.track === "function") &&
        !isGtmActiveOnPage(config),
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

  // ── 5. Server-side Conversions API forwarder (Deduplicated via shared event_id) ─
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
