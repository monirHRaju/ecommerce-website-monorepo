import crypto from 'crypto';
import { Types } from 'mongoose';
import config from '../config';
import TrackingLog from '../models/trackingLog.model';
import TrackingSettings, {
  ITrackingSettings,
  TrackingEventKey,
} from '../models/trackingSettings.model';
import { normalizeBdPhone } from '../utils/phone';

const META_GRAPH_VERSION = 'v20.0';

export interface TrackingUserDataInput {
  email?: string;
  phone?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  zip?: string;
  country?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
}

export interface TrackingCustomDataInput {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_type?: string;
  content_name?: string;
  content_category?: string;
  contents?: Array<{
    id: string;
    quantity: number;
    item_price?: number;
  }>;
  num_items?: number;
  order_id?: string;
  search_string?: string;
}

export interface SendCapiEventOptions {
  eventName: TrackingEventKey | string;
  eventId: string;
  eventTime?: number;
  eventSourceUrl?: string;
  actionSource?: 'website';
  source?: 'browser' | 'server_order' | 'test';
  userData?: TrackingUserDataInput;
  customData?: TrackingCustomDataInput;
  orderId?: Types.ObjectId | string;
  orderNumber?: string;
  userId?: Types.ObjectId | string;
  forceSend?: boolean;
}

export function sha256Hash(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Normalizes a phone number to digits-only with country code (e.g., 8801712345678 for BD)
 * before SHA-256 hashing per Meta Conversions API specification.
 */
export function normalizeAndHashPhone(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  const bdLocal = normalizeBdPhone(raw);
  if (bdLocal) {
    return sha256Hash(`88${bdLocal}`);
  }
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return undefined;
  return sha256Hash(digits);
}

/**
 * Loads the TrackingSettings document from MongoDB (creating defaults if none exist)
 * and merges with environment fallbacks.
 */
export async function getEffectiveTrackingSettings(): Promise<ITrackingSettings> {
  let doc = await TrackingSettings.findOne().lean();
  if (!doc) {
    const created = await TrackingSettings.create({
      metaEnabled: true,
      metaPixelId: config.meta_pixel_id || '',
      metaCapiEnabled: true,
      metaAccessToken: config.meta_capi_token || '',
      metaTestEventCode: config.meta_test_event_code || '',
      gaEnabled: Boolean(config.ga_measurement_id || config.gtm_container_id),
      gaMeasurementId: config.ga_measurement_id || '',
      gtmContainerId: config.gtm_container_id || '',
      tiktokEnabled: Boolean(config.tiktok_pixel_id),
      tiktokPixelId: config.tiktok_pixel_id || '',
    });
    doc = created.toObject();
  }

  return {
    ...doc,
    metaPixelId: doc.metaPixelId || config.meta_pixel_id || '',
    metaAccessToken: doc.metaAccessToken || config.meta_capi_token || '',
    metaTestEventCode: doc.metaTestEventCode || config.meta_test_event_code || '',
    gaMeasurementId: doc.gaMeasurementId || config.ga_measurement_id || '',
    gtmContainerId: doc.gtmContainerId || config.gtm_container_id || '',
    tiktokPixelId: doc.tiktokPixelId || config.tiktok_pixel_id || '',
  };
}

/**
 * Returns public-safe tracking settings (never exposes metaAccessToken).
 */
export async function getPublicTrackingConfig() {
  const settings = await getEffectiveTrackingSettings();
  return {
    metaEnabled: settings.metaEnabled,
    metaPixelId: settings.metaPixelId,
    metaCapiEnabled: settings.metaCapiEnabled,
    gaEnabled: settings.gaEnabled,
    gaMeasurementId: settings.gaMeasurementId,
    gtmContainerId: settings.gtmContainerId,
    tiktokEnabled: settings.tiktokEnabled,
    tiktokPixelId: settings.tiktokPixelId,
    requireCookieConsent: settings.requireCookieConsent,
    consentBannerText: settings.consentBannerText,
    events: settings.events,
  };
}

/**
 * Builds the hashed `user_data` payload required by Meta Conversions API.
 */
export function buildMetaUserData(input: TrackingUserDataInput = {}) {
  const userData: Record<string, any> = {};

  if (input.email && !input.email.endsWith('@guest.local')) {
    const em = sha256Hash(input.email);
    if (em) userData.em = [em];
  }

  if (input.phone) {
    const ph = normalizeAndHashPhone(input.phone);
    if (ph) userData.ph = [ph];
  }

  let fnRaw = input.firstName;
  let lnRaw = input.lastName;
  if (!fnRaw && input.name) {
    const parts = input.name.trim().split(/\s+/);
    fnRaw = parts[0];
    if (parts.length > 1) {
      lnRaw = parts.slice(1).join(' ');
    }
  }

  if (fnRaw) {
    const fn = sha256Hash(fnRaw.replace(/[^a-zA-Z\u0980-\u09FF]/g, ''));
    if (fn) userData.fn = [fn];
  }
  if (lnRaw) {
    const ln = sha256Hash(lnRaw.replace(/[^a-zA-Z\u0980-\u09FF]/g, ''));
    if (ln) userData.ln = [ln];
  }

  if (input.city) {
    const ct = sha256Hash(input.city.replace(/[^a-zA-Z]/g, ''));
    if (ct) userData.ct = [ct];
  }
  if (input.zip) {
    const zp = sha256Hash(input.zip);
    if (zp) userData.zp = [zp];
  }

  const countryCode =
    !input.country || input.country.toLowerCase().startsWith('bangladesh')
      ? 'bd'
      : input.country.slice(0, 2).toLowerCase();
  const countryHash = sha256Hash(countryCode);
  if (countryHash) userData.country = [countryHash];

  if (input.externalId) {
    const ext = sha256Hash(input.externalId);
    if (ext) userData.external_id = [ext];
  }

  if (input.clientIpAddress) {
    userData.client_ip_address = input.clientIpAddress;
  }
  if (input.clientUserAgent) {
    userData.client_user_agent = input.clientUserAgent;
  }
  if (input.fbp) {
    userData.fbp = input.fbp;
  }
  if (input.fbc) {
    userData.fbc = input.fbc;
  }

  return userData;
}

/**
 * Dispatches an event to Meta Conversions API (or records a dry_run log if credentials aren't set yet).
 * Safe to call without awaiting — never throws to callers.
 */
export async function sendMetaCapiEvent(options: SendCapiEventOptions) {
  const {
    eventName,
    eventId,
    eventTime = Math.floor(Date.now() / 1000),
    eventSourceUrl,
    actionSource = 'website',
    source = 'browser',
    userData = {},
    customData = {},
    orderId,
    orderNumber,
    userId,
    forceSend = false,
  } = options;

  try {
    const settings = await getEffectiveTrackingSettings();

    // Check if individual event is toggled off (unless forceSend is true, e.g. Test Event)
    const eventKey = eventName as TrackingEventKey;
    if (
      !forceSend &&
      settings.events &&
      settings.events[eventKey] === false
    ) {
      return {
        success: false,
        status: 'dry_run' as const,
        message: `Event ${eventName} is disabled in tracking settings`,
      };
    }

    const pixelId = settings.metaPixelId?.trim();
    const accessToken = settings.metaAccessToken?.trim();
    const isLive =
      settings.metaEnabled &&
      settings.metaCapiEnabled &&
      Boolean(pixelId) &&
      Boolean(accessToken);

    const hashedUserData = buildMetaUserData(userData);

    const cleanCustomData: Record<string, any> = {};
    if (customData.value !== undefined) cleanCustomData.value = Number(customData.value);
    cleanCustomData.currency = customData.currency || 'BDT';
    if (customData.content_ids?.length) cleanCustomData.content_ids = customData.content_ids;
    if (customData.content_type) cleanCustomData.content_type = customData.content_type;
    if (customData.content_name) cleanCustomData.content_name = customData.content_name;
    if (customData.content_category) cleanCustomData.content_category = customData.content_category;
    if (customData.contents?.length) cleanCustomData.contents = customData.contents;
    if (customData.num_items !== undefined) cleanCustomData.num_items = Number(customData.num_items);
    if (customData.order_id) cleanCustomData.order_id = customData.order_id;
    if (customData.search_string) cleanCustomData.search_string = customData.search_string;

    const eventPayload: Record<string, any> = {
      event_name: eventName,
      event_time: eventTime,
      event_id: eventId,
      action_source: actionSource,
      event_source_url: eventSourceUrl || config.client_url,
      user_data: hashedUserData,
      custom_data: cleanCustomData,
    };

    const requestBody: Record<string, any> = {
      data: [eventPayload],
    };

    if (settings.metaTestEventCode?.trim()) {
      requestBody.test_event_code = settings.metaTestEventCode.trim();
    }

    if (!isLive) {
      const reason = !settings.metaEnabled
        ? 'Meta Pixel & CAPI disabled in settings'
        : !settings.metaCapiEnabled
          ? 'Meta Conversions API disabled in settings'
          : 'Meta Pixel ID or CAPI Access Token not configured yet (Dry-Run)';

      await TrackingLog.create({
        eventName,
        eventId,
        source,
        platform: 'meta_capi',
        status: 'dry_run',
        pixelId: pixelId || undefined,
        eventSourceUrl: eventSourceUrl || config.client_url,
        value: customData.value,
        currency: cleanCustomData.currency,
        contentIds: customData.content_ids || [],
        orderId: orderId && Types.ObjectId.isValid(String(orderId)) ? new Types.ObjectId(String(orderId)) : undefined,
        orderNumber,
        userId: userId && Types.ObjectId.isValid(String(userId)) ? new Types.ObjectId(String(userId)) : undefined,
        responseCode: 0,
        responseMessage: reason,
      });

      return {
        success: true,
        status: 'dry_run' as const,
        message: reason,
      };
    }

    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(
      pixelId
    )}/events?access_token=${encodeURIComponent(accessToken)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const json: any = await response.json().catch(() => ({}));
    const ok = response.ok && !json.error;

    const responseMessage = ok
      ? `Events received: ${json.events_received ?? 1}${
          settings.metaTestEventCode ? ` (Test Code: ${settings.metaTestEventCode})` : ''
        }`
      : json?.error?.message || `HTTP ${response.status}`;

    await TrackingLog.create({
      eventName,
      eventId,
      source,
      platform: 'meta_capi',
      status: ok ? 'sent' : 'failed',
      pixelId,
      eventSourceUrl: eventSourceUrl || config.client_url,
      value: customData.value,
      currency: cleanCustomData.currency,
      contentIds: customData.content_ids || [],
      orderId: orderId && Types.ObjectId.isValid(String(orderId)) ? new Types.ObjectId(String(orderId)) : undefined,
      orderNumber,
      userId: userId && Types.ObjectId.isValid(String(userId)) ? new Types.ObjectId(String(userId)) : undefined,
      responseCode: response.status,
      responseMessage,
      eventsReceived: json?.events_received,
      fbtraceId: json?.fbtrace_id || json?.error?.fbtrace_id,
    });

    return {
      success: ok,
      status: ok ? ('sent' as const) : ('failed' as const),
      responseCode: response.status,
      message: responseMessage,
      eventsReceived: json?.events_received,
      fbtraceId: json?.fbtrace_id,
    };
  } catch (err: any) {
    console.error('[Tracking CAPI Error]', err?.message || err);
    return {
      success: false,
      status: 'failed' as const,
      message: err?.message || 'Unexpected CAPI error',
    };
  }
}
