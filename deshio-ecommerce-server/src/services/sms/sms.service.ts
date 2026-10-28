import { Types } from 'mongoose';
import config from '../../config';
import SiteSettings from '../../models/settings.model';
import SmsLog from '../../models/smsLog.model';
import SmsSettings, {
  DEFAULT_SMS_TEMPLATES,
  ISmsSettings,
  SmsEventKey,
} from '../../models/smsSettings.model';
import { toBulkSmsPhone } from '../../utils/phone';
import { sendBulkSmsBd } from './bulksmsbd.provider';

export interface SmsTemplateVars {
  name?: string;
  phone?: string;
  password?: string;
  orderNumber?: string;
  total?: string | number;
  status?: string;
  siteName?: string;
  loginUrl?: string;
  trackUrl?: string;
}

export interface SendSmsOptions {
  to: string;
  message: string;
  event?: string;
  orderId?: Types.ObjectId | string;
  userId?: Types.ObjectId | string;
}

/**
 * Loads the SmsSettings document from MongoDB (creating defaults if none exist)
 * and merges with environment fallbacks.
 */
export async function getEffectiveSmsSettings(): Promise<ISmsSettings> {
  let doc = await SmsSettings.findOne().lean();
  if (!doc) {
    const created = await SmsSettings.create({
      enabled: config.sms_enabled,
      apiKey: config.sms_api_key,
      senderId: config.sms_sender_id,
    });
    doc = created.toObject();
  }

  return {
    ...doc,
    apiKey: doc.apiKey || config.sms_api_key || '',
    senderId: doc.senderId || config.sms_sender_id || '',
  };
}

/**
 * Replaces {placeholder} tokens in a template string.
 */
export function renderSmsTemplate(template: string, vars: SmsTemplateVars): string {
  const merged: Record<string, string> = {
    name: vars.name || 'Customer',
    phone: vars.phone || '',
    password: vars.password || '',
    orderNumber: vars.orderNumber || '',
    total: vars.total !== undefined ? String(vars.total) : '',
    status: vars.status || '',
    siteName: vars.siteName || 'Deshio',
    loginUrl: vars.loginUrl || `${config.client_url}/login`,
    trackUrl: vars.trackUrl || `${config.client_url}/track-order`,
  };

  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    return merged[key] !== undefined ? merged[key] : `{${key}}`;
  });
}

/**
 * Sends a single SMS via BulkSMSBD (or records a dry_run log if credentials are not configured yet).
 * Safe to call without awaiting — never throws to callers.
 */
export async function sendSms(options: SendSmsOptions) {
  const { to, message, event = 'manual', orderId, userId } = options;

  try {
    const formattedNumber = toBulkSmsPhone(to);
    if (!formattedNumber) {
      await SmsLog.create({
        to: String(to || ''),
        message,
        event,
        status: 'failed',
        providerCode: 1001,
        providerMessage: 'Invalid Bangladesh mobile number format',
        orderId: orderId ? new Types.ObjectId(String(orderId)) : undefined,
        userId: userId ? new Types.ObjectId(String(userId)) : undefined,
      });
      return { success: false, status: 'failed' as const, message: 'Invalid mobile number' };
    }

    const settings = await getEffectiveSmsSettings();

    // Dry-run if disabled or credentials not yet provided
    if (!settings.enabled || !settings.apiKey || !settings.senderId) {
      const reason = !settings.enabled
        ? 'SMS gateway disabled in settings'
        : 'BulkSMSBD API Key or Sender ID not configured yet (Dry-Run)';
      console.log(`[SMS Dry-Run] To: ${formattedNumber} | Event: ${event} | Msg: ${message}`);

      await SmsLog.create({
        to: formattedNumber,
        message,
        event,
        status: 'dry_run',
        providerCode: 0,
        providerMessage: reason,
        orderId: orderId ? new Types.ObjectId(String(orderId)) : undefined,
        userId: userId ? new Types.ObjectId(String(userId)) : undefined,
      });

      return { success: true, status: 'dry_run' as const, message: reason };
    }

    const result = await sendBulkSmsBd({
      apiKey: settings.apiKey,
      senderId: settings.senderId,
      number: formattedNumber,
      message,
    });

    await SmsLog.create({
      to: formattedNumber,
      message,
      event,
      status: result.success ? 'sent' : 'failed',
      providerCode: result.code,
      providerMessage: result.message,
      orderId: orderId ? new Types.ObjectId(String(orderId)) : undefined,
      userId: userId ? new Types.ObjectId(String(userId)) : undefined,
    });

    if (result.success) {
      console.log(`[SMS Sent] To: ${formattedNumber} | Event: ${event}`);
    } else {
      console.warn(`[SMS Failed] To: ${formattedNumber} | Code: ${result.code} | ${result.message}`);
    }

    return {
      success: result.success,
      status: result.success ? ('sent' as const) : ('failed' as const),
      code: result.code,
      message: result.message,
    };
  } catch (err: any) {
    console.error('[SMS Service Error]', err?.message || err);
    return {
      success: false,
      status: 'failed' as const,
      message: err?.message || 'Unexpected SMS service error',
    };
  }
}

/**
 * Sends an event-driven SMS if that specific event is enabled in SmsSettings.
 */
export async function sendEventSms(
  eventKey: SmsEventKey,
  to: string,
  vars: SmsTemplateVars,
  refs?: { orderId?: Types.ObjectId | string; userId?: Types.ObjectId | string }
) {
  try {
    const [smsSettings, siteSettings] = await Promise.all([
      getEffectiveSmsSettings(),
      SiteSettings.findOne().select('siteName').lean(),
    ]);

    const eventConfig = smsSettings.events?.[eventKey];
    if (eventConfig && eventConfig.enabled === false) {
      return;
    }

    const template = eventConfig?.template || DEFAULT_SMS_TEMPLATES[eventKey];
    const message = renderSmsTemplate(template, {
      ...vars,
      siteName: vars.siteName || siteSettings?.siteName || 'Deshio',
    });

    return await sendSms({
      to,
      message,
      event: eventKey,
      orderId: refs?.orderId,
      userId: refs?.userId,
    });
  } catch (err: any) {
    console.error(`[SMS Event Error: ${eventKey}]`, err?.message || err);
  }
}

/**
 * Sends an optional admin alert SMS if `adminAlertPhone` is configured in SmsSettings.
 */
export async function sendAdminOrderAlertSms(params: {
  orderId?: Types.ObjectId | string;
  orderNumber: string;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
}) {
  try {
    const smsSettings = await getEffectiveSmsSettings();
    const adminPhone = smsSettings.adminAlertPhone?.trim();
    if (!adminPhone) return;

    const message = `New Order #${params.orderNumber} placed by ${params.customerName} (${params.customerPhone}). Total: Tk ${params.totalAmount}.`;
    await sendSms({
      to: adminPhone,
      message,
      event: 'admin_order_alert',
      orderId: params.orderId,
    });
  } catch (err: any) {
    console.error('[Admin Order Alert SMS Error]', err?.message || err);
  }
}
