import { Schema, model } from 'mongoose';

export type SmsEventKey =
  | 'account_created'
  | 'order_placed'
  | 'order_processing'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled';

export interface ISmsEventConfig {
  enabled: boolean;
  template: string;
}

export interface ISmsSettings {
  enabled: boolean;
  apiKey: string;
  senderId: string;
  adminAlertPhone?: string;
  events: Record<SmsEventKey, ISmsEventConfig>;
  createdAt?: Date;
  updatedAt?: Date;
}

export const DEFAULT_SMS_TEMPLATES: Record<SmsEventKey, string> = {
  account_created:
    'Welcome to {siteName}! Your Login ID: {phone}, Password: {password}. Sign in at {loginUrl}',
  order_placed:
    '{siteName}: Hi {name}, your order #{orderNumber} (Tk {total}) is confirmed! Track at {trackUrl}',
  order_processing:
    '{siteName}: Your order #{orderNumber} is now being processed and prepared for dispatch.',
  order_shipped:
    '{siteName}: Great news! Your order #{orderNumber} has been shipped and is on its way.',
  order_delivered:
    '{siteName}: Your order #{orderNumber} has been delivered. Thank you for shopping with us!',
  order_cancelled:
    '{siteName}: Your order #{orderNumber} has been cancelled.',
};

const eventSubSchema = (defaultTemplate: string) =>
  new Schema<ISmsEventConfig>(
    {
      enabled: { type: Boolean, default: true },
      template: { type: String, default: defaultTemplate, trim: true },
    },
    { _id: false }
  );

const smsSettingsSchema = new Schema<ISmsSettings>(
  {
    enabled: { type: Boolean, default: true },
    apiKey: { type: String, default: '', trim: true },
    senderId: { type: String, default: '', trim: true },
    adminAlertPhone: { type: String, default: '', trim: true },
    events: {
      account_created: {
        type: eventSubSchema(DEFAULT_SMS_TEMPLATES.account_created),
        default: () => ({
          enabled: true,
          template: DEFAULT_SMS_TEMPLATES.account_created,
        }),
      },
      order_placed: {
        type: eventSubSchema(DEFAULT_SMS_TEMPLATES.order_placed),
        default: () => ({
          enabled: true,
          template: DEFAULT_SMS_TEMPLATES.order_placed,
        }),
      },
      order_processing: {
        type: eventSubSchema(DEFAULT_SMS_TEMPLATES.order_processing),
        default: () => ({
          enabled: true,
          template: DEFAULT_SMS_TEMPLATES.order_processing,
        }),
      },
      order_shipped: {
        type: eventSubSchema(DEFAULT_SMS_TEMPLATES.order_shipped),
        default: () => ({
          enabled: true,
          template: DEFAULT_SMS_TEMPLATES.order_shipped,
        }),
      },
      order_delivered: {
        type: eventSubSchema(DEFAULT_SMS_TEMPLATES.order_delivered),
        default: () => ({
          enabled: true,
          template: DEFAULT_SMS_TEMPLATES.order_delivered,
        }),
      },
      order_cancelled: {
        type: eventSubSchema(DEFAULT_SMS_TEMPLATES.order_cancelled),
        default: () => ({
          enabled: true,
          template: DEFAULT_SMS_TEMPLATES.order_cancelled,
        }),
      },
    },
  },
  { timestamps: true }
);

const SmsSettings = model<ISmsSettings>('SmsSettings', smsSettingsSchema);
export default SmsSettings;
