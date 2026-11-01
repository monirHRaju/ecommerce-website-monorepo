import { Schema, model } from 'mongoose';

export type TrackingEventKey =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'
  | 'Search'
  | 'CompleteRegistration';

export interface ITrackingSettings {
  metaEnabled: boolean;
  metaPixelId: string;
  metaCapiEnabled: boolean;
  metaAccessToken: string;
  metaTestEventCode: string;
  gaEnabled: boolean;
  gaMeasurementId: string;
  gtmContainerId: string;
  tiktokEnabled: boolean;
  tiktokPixelId: string;
  requireCookieConsent: boolean;
  consentBannerText: string;
  events: Record<TrackingEventKey, boolean>;
  createdAt?: Date;
  updatedAt?: Date;
}

const trackingSettingsSchema = new Schema<ITrackingSettings>(
  {
    metaEnabled: { type: Boolean, default: true },
    metaPixelId: { type: String, default: '', trim: true },
    metaCapiEnabled: { type: Boolean, default: true },
    metaAccessToken: { type: String, default: '', trim: true },
    metaTestEventCode: { type: String, default: '', trim: true },
    gaEnabled: { type: Boolean, default: false },
    gaMeasurementId: { type: String, default: '', trim: true },
    gtmContainerId: { type: String, default: '', trim: true },
    tiktokEnabled: { type: Boolean, default: false },
    tiktokPixelId: { type: String, default: '', trim: true },
    requireCookieConsent: { type: Boolean, default: false },
    consentBannerText: {
      type: String,
      default:
        'We use cookies and analytics pixels to personalize your shopping experience and measure our campaigns.',
      trim: true,
    },
    events: {
      PageView: { type: Boolean, default: true },
      ViewContent: { type: Boolean, default: true },
      AddToCart: { type: Boolean, default: true },
      InitiateCheckout: { type: Boolean, default: true },
      AddPaymentInfo: { type: Boolean, default: true },
      Purchase: { type: Boolean, default: true },
      Search: { type: Boolean, default: true },
      CompleteRegistration: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const TrackingSettings = model<ITrackingSettings>(
  'TrackingSettings',
  trackingSettingsSchema
);
export default TrackingSettings;
