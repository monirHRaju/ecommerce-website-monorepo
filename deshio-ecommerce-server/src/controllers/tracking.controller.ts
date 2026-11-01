import crypto from 'crypto';
import { Request, Response } from 'express';
import TrackingLog from '../models/trackingLog.model';
import TrackingSettings, { TrackingEventKey } from '../models/trackingSettings.model';
import {
  getEffectiveTrackingSettings,
  getPublicTrackingConfig,
  sendMetaCapiEvent,
} from '../services/tracking.service';
import asyncHandler from '../utils/asyncHandler';
import sendResponse from '../utils/sendResponse';

const TRACKING_EVENT_KEYS: TrackingEventKey[] = [
  'PageView',
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'AddPaymentInfo',
  'Purchase',
  'Search',
  'CompleteRegistration',
];

function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '';
}

// GET /api/v1/tracking/config (public)
export const getPublicTrackingSettings = asyncHandler(async (_req: Request, res: Response) => {
  const configData = await getPublicTrackingConfig();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Public tracking configuration retrieved',
    data: configData,
  });
});

// POST /api/v1/tracking/event (public — browser CAPI forwarder)
export const ingestBrowserTrackingEvent = asyncHandler(async (req: Request, res: Response) => {
  const {
    eventName,
    eventId,
    eventSourceUrl,
    customData,
    userData,
    orderId,
    orderNumber,
  } = req.body;

  if (!eventName || typeof eventName !== 'string') {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'eventName is required',
      data: null,
    });
  }

  const resolvedEventId =
    eventId && typeof eventId === 'string'
      ? eventId.trim()
      : `${eventName}_${crypto.randomUUID()}`;

  const clientIpAddress = extractClientIp(req);
  const clientUserAgent = String(req.headers['user-agent'] || '');

  const result = await sendMetaCapiEvent({
    eventName: eventName.trim(),
    eventId: resolvedEventId,
    eventSourceUrl: eventSourceUrl || req.headers.referer || undefined,
    source: 'browser',
    orderId,
    orderNumber,
    userId: (req as any).user?.id || userData?.externalId,
    userData: {
      ...(userData || {}),
      clientIpAddress,
      clientUserAgent,
    },
    customData: customData || {},
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Tracking event processed',
    data: {
      eventId: resolvedEventId,
      status: result.status,
      message: result.message,
    },
  });
});

// GET /api/v1/settings/tracking (admin)
export const getAdminTrackingSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await getEffectiveTrackingSettings();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Tracking settings retrieved successfully',
    data: {
      ...settings,
      hasAccessToken: Boolean(settings.metaAccessToken),
    },
  });
});

// PATCH /api/v1/settings/tracking (admin)
export const updateAdminTrackingSettings = asyncHandler(async (req: Request, res: Response) => {
  const {
    metaEnabled,
    metaPixelId,
    metaCapiEnabled,
    metaAccessToken,
    metaTestEventCode,
    gaEnabled,
    gaMeasurementId,
    gtmContainerId,
    tiktokEnabled,
    tiktokPixelId,
    requireCookieConsent,
    consentBannerText,
    events,
  } = req.body;

  const update: Record<string, any> = {};

  if (metaEnabled !== undefined) update.metaEnabled = Boolean(metaEnabled);
  if (metaPixelId !== undefined) update.metaPixelId = String(metaPixelId).trim();
  if (metaCapiEnabled !== undefined) update.metaCapiEnabled = Boolean(metaCapiEnabled);
  if (metaAccessToken !== undefined) update.metaAccessToken = String(metaAccessToken).trim();
  if (metaTestEventCode !== undefined)
    update.metaTestEventCode = String(metaTestEventCode).trim();
  if (gaEnabled !== undefined) update.gaEnabled = Boolean(gaEnabled);
  if (gaMeasurementId !== undefined) update.gaMeasurementId = String(gaMeasurementId).trim();
  if (gtmContainerId !== undefined) update.gtmContainerId = String(gtmContainerId).trim();
  if (tiktokEnabled !== undefined) update.tiktokEnabled = Boolean(tiktokEnabled);
  if (tiktokPixelId !== undefined) update.tiktokPixelId = String(tiktokPixelId).trim();
  if (requireCookieConsent !== undefined)
    update.requireCookieConsent = Boolean(requireCookieConsent);
  if (consentBannerText !== undefined)
    update.consentBannerText = String(consentBannerText).trim();

  if (events && typeof events === 'object') {
    for (const key of TRACKING_EVENT_KEYS) {
      if (events[key] !== undefined) {
        update[`events.${key}`] = Boolean(events[key]);
      }
    }
  }

  await TrackingSettings.findOneAndUpdate(
    {},
    { $set: update },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    }
  );

  const effective = await getEffectiveTrackingSettings();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Marketing & tracking settings saved successfully',
    data: {
      ...effective,
      hasAccessToken: Boolean(effective.metaAccessToken),
    },
  });
});

// POST /api/v1/settings/tracking/test (admin)
export const sendTestTrackingEvent = asyncHandler(async (req: Request, res: Response) => {
  const { eventName = 'Purchase', testEmail, testPhone, value = 2490 } = req.body;

  const eventId = `test_${eventName}_${Date.now()}`;
  const clientIpAddress = extractClientIp(req);
  const clientUserAgent = String(req.headers['user-agent'] || '');

  const result = await sendMetaCapiEvent({
    eventName: String(eventName),
    eventId,
    source: 'test',
    forceSend: true,
    userData: {
      email: testEmail || 'test@deshio.com',
      phone: testPhone || '01700000000',
      name: 'Test Customer',
      city: 'Dhaka',
      country: 'bd',
      clientIpAddress,
      clientUserAgent,
    },
    customData: {
      value: Number(value) || 2490,
      currency: 'BDT',
      content_ids: ['TEST-SKU-001'],
      content_type: 'product',
      content_name: 'Deshio Diagnostic Test Garment',
      num_items: 1,
      order_id: `TEST-ORD-${Date.now().toString().slice(-5)}`,
    },
  });

  sendResponse(res, {
    statusCode: 200,
    success: result.success,
    message:
      result.status === 'sent'
        ? `Test ${eventName} event dispatched to Meta CAPI!`
        : result.status === 'dry_run'
          ? `Dry-Run recorded: ${result.message}`
          : `CAPI dispatch failed: ${result.message}`,
    data: {
      eventId,
      ...result,
    },
  });
});

// GET /api/v1/settings/tracking/logs (admin)
export const getTrackingLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (req.query.status && ['sent', 'failed', 'dry_run'].includes(String(req.query.status))) {
    filter.status = String(req.query.status);
  }
  if (req.query.eventName && String(req.query.eventName).trim()) {
    filter.eventName = String(req.query.eventName).trim();
  }
  if (req.query.source && ['browser', 'server_order', 'test'].includes(String(req.query.source))) {
    filter.source = String(req.query.source);
  }

  const [logs, total] = await Promise.all([
    TrackingLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    TrackingLog.countDocuments(filter),
  ]);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Tracking logs retrieved successfully',
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: logs,
  });
});
