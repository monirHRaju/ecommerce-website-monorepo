import { Schema, model } from 'mongoose';
import { ISiteSettings } from '../types';

const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    siteName: {
      type: String,
      default: 'Deshio',
      trim: true,
    },
    siteTitle: {
      type: String,
      default: 'Deshio — Timeless Elegance & Contemporary Fashion',
      trim: true,
    },
    titleTemplate: {
      type: String,
      default: '%s | Deshio',
      trim: true,
    },
    metaDescription: {
      type: String,
      default:
        'Discover curated luxury essentials, exquisite handlooms, and contemporary everyday wear crafted from breathable, premium fabrics. Nationwide delivery across Bangladesh.',
      trim: true,
    },
    metaKeywords: {
      type: [String],
      default: [
        'fashion bangladesh',
        'panjabi online',
        'jamdani saree',
        'handloom cotton',
        'mens fashion dhaka',
        'womens kurti',
        'deshio fashion',
      ],
    },
    canonicalUrl: {
      type: String,
      default: 'https://deshio.com',
      trim: true,
    },
    ogImage: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80',
    },
    twitterHandle: {
      type: String,
      default: '@deshio_official',
      trim: true,
    },
    googleSiteVerification: {
      type: String,
      default: '',
      trim: true,
    },
    bingSiteVerification: {
      type: String,
      default: '',
      trim: true,
    },
    indexSite: {
      type: Boolean,
      default: true,
    },
    contactEmail: {
      type: String,
      default: 'care@deshio.com',
      trim: true,
    },
    contactPhone: {
      type: String,
      default: '+880 1700-000000',
      trim: true,
    },
      socialLinks: {
      facebook: { type: String, default: 'https://facebook.com/deshio' },
      instagram: { type: String, default: 'https://instagram.com/deshio' },
      youtube: { type: String, default: '' },
      pinterest: { type: String, default: '' },
      tiktok: { type: String, default: '' },
      whatsapp: { type: String, default: '+880 1700-000000' },
      messenger: { type: String, default: 'https://m.me/deshio' },
    },
    whatsappSupport: {
      type: String,
      default: '+880 1700-000000',
      trim: true,
    },
    messengerSupport: {
      type: String,
      default: 'https://m.me/deshio',
      trim: true,
    },
    showFloatingSupport: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const SiteSettings = model<ISiteSettings>('SiteSettings', siteSettingsSchema);
export default SiteSettings;
