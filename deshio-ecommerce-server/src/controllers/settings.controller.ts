import { Request, Response } from 'express';
import SiteSettings from '../models/settings.model';
import SmsLog from '../models/smsLog.model';
import SmsSettings, { DEFAULT_SMS_TEMPLATES, SmsEventKey } from '../models/smsSettings.model';
import { getBulkSmsBalance } from '../services/sms/bulksmsbd.provider';
import { getEffectiveSmsSettings, sendSms } from '../services/sms/sms.service';
import AppError from '../utils/AppError';
import asyncHandler from '../utils/asyncHandler';
import sendResponse from '../utils/sendResponse';

// GET /api/v1/settings/seo (public)
export const getSeoSettings = asyncHandler(async (_req: Request, res: Response) => {
  let settings = await SiteSettings.findOne().lean();
  if (!settings) {
    settings = await SiteSettings.create({});
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'SEO settings retrieved successfully',
    data: settings,
  });
});

// PATCH /api/v1/settings/seo (admin)
export const updateSeoSettings = asyncHandler(async (req: Request, res: Response) => {
  const {
    siteName,
    siteTitle,
    titleTemplate,
    metaDescription,
    metaKeywords,
    canonicalUrl,
    ogImage,
    twitterHandle,
    googleSiteVerification,
    bingSiteVerification,
    indexSite,
    contactEmail,
    contactPhone,
    socialLinks,
    whatsappSupport,
    messengerSupport,
    showFloatingSupport,
    logoUrl,
    tagline,
    announcementText,
    showAnnouncement,
    address,
    showroomHours,
    helplineHours,
    footerDescription,
    copyrightText,
    contactPageTitle,
    contactPageSubtitle,
    contactFaqs,
    aboutHeroBadge,
    aboutHeroTitle,
    aboutHeroSubtitle,
    aboutStoryBadge,
    aboutStoryTitle,
    aboutStoryParagraph1,
    aboutStoryParagraph2,
    aboutStats,
    aboutPillars,
    aboutMilestones,
  } = req.body;

  const update: Record<string, any> = {};

  if (siteName !== undefined) update.siteName = String(siteName).trim();
  if (siteTitle !== undefined) update.siteTitle = String(siteTitle).trim();
  if (titleTemplate !== undefined) update.titleTemplate = String(titleTemplate).trim();
  if (metaDescription !== undefined) update.metaDescription = String(metaDescription).trim();
  if (metaKeywords !== undefined) {
    update.metaKeywords = Array.isArray(metaKeywords)
      ? metaKeywords.map((k) => String(k).trim()).filter(Boolean)
      : String(metaKeywords)
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean);
  }
  if (canonicalUrl !== undefined) update.canonicalUrl = String(canonicalUrl).trim();
  if (ogImage !== undefined) update.ogImage = String(ogImage).trim();
  if (twitterHandle !== undefined) update.twitterHandle = String(twitterHandle).trim();
  if (googleSiteVerification !== undefined)
    update.googleSiteVerification = String(googleSiteVerification).trim();
  if (bingSiteVerification !== undefined)
    update.bingSiteVerification = String(bingSiteVerification).trim();
  if (indexSite !== undefined) update.indexSite = Boolean(indexSite);
  if (contactEmail !== undefined) update.contactEmail = String(contactEmail).trim();
  if (contactPhone !== undefined) update.contactPhone = String(contactPhone).trim();
  if (whatsappSupport !== undefined) update.whatsappSupport = String(whatsappSupport).trim();
  if (messengerSupport !== undefined) update.messengerSupport = String(messengerSupport).trim();
  if (showFloatingSupport !== undefined) update.showFloatingSupport = Boolean(showFloatingSupport);
  if (logoUrl !== undefined) update.logoUrl = String(logoUrl).trim();
  if (tagline !== undefined) update.tagline = String(tagline).trim();
  if (announcementText !== undefined) update.announcementText = String(announcementText).trim();
  if (showAnnouncement !== undefined) update.showAnnouncement = Boolean(showAnnouncement);
  if (address !== undefined) update.address = String(address).trim();
  if (showroomHours !== undefined) update.showroomHours = String(showroomHours).trim();
  if (helplineHours !== undefined) update.helplineHours = String(helplineHours).trim();
  if (footerDescription !== undefined) update.footerDescription = String(footerDescription).trim();
  if (copyrightText !== undefined) update.copyrightText = String(copyrightText).trim();
  if (contactPageTitle !== undefined) update.contactPageTitle = String(contactPageTitle).trim();
  if (contactPageSubtitle !== undefined) update.contactPageSubtitle = String(contactPageSubtitle).trim();
  if (Array.isArray(contactFaqs)) update.contactFaqs = contactFaqs;
  if (aboutHeroBadge !== undefined) update.aboutHeroBadge = String(aboutHeroBadge).trim();
  if (aboutHeroTitle !== undefined) update.aboutHeroTitle = String(aboutHeroTitle).trim();
  if (aboutHeroSubtitle !== undefined) update.aboutHeroSubtitle = String(aboutHeroSubtitle).trim();
  if (aboutStoryBadge !== undefined) update.aboutStoryBadge = String(aboutStoryBadge).trim();
  if (aboutStoryTitle !== undefined) update.aboutStoryTitle = String(aboutStoryTitle).trim();
  if (aboutStoryParagraph1 !== undefined) update.aboutStoryParagraph1 = String(aboutStoryParagraph1).trim();
  if (aboutStoryParagraph2 !== undefined) update.aboutStoryParagraph2 = String(aboutStoryParagraph2).trim();
  if (Array.isArray(aboutStats)) update.aboutStats = aboutStats;
  if (Array.isArray(aboutPillars)) update.aboutPillars = aboutPillars;
  if (Array.isArray(aboutMilestones)) update.aboutMilestones = aboutMilestones;
  if (socialLinks !== undefined && typeof socialLinks === 'object') {
    update.socialLinks = socialLinks;
    // Also keep top-level fields synced if passed in socialLinks
    if (socialLinks.whatsapp && whatsappSupport === undefined) {
      update.whatsappSupport = String(socialLinks.whatsapp).trim();
    }
    if (socialLinks.messenger && messengerSupport === undefined) {
      update.messengerSupport = String(socialLinks.messenger).trim();
    }
  }

  let settings = await SiteSettings.findOneAndUpdate({}, update, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
    runValidators: true,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'SEO settings updated successfully',
    data: settings,
  });
});

// ─── SMS Gateway Settings & Logs (Admin only) ───────────────────────────────

const SMS_EVENT_KEYS: SmsEventKey[] = [
  'account_created',
  'order_placed',
  'order_processing',
  'order_shipped',
  'order_delivered',
  'order_cancelled',
];

// GET /api/v1/settings/sms (admin)
export const getSmsSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await getEffectiveSmsSettings();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'SMS settings retrieved successfully',
    data: {
      ...settings,
      hasApiKey: Boolean(settings.apiKey),
      defaultTemplates: DEFAULT_SMS_TEMPLATES,
    },
  });
});

// PATCH /api/v1/settings/sms (admin)
export const updateSmsSettings = asyncHandler(async (req: Request, res: Response) => {
  const { enabled, apiKey, senderId, adminAlertPhone, events } = req.body;

  const update: Record<string, any> = {};

  if (enabled !== undefined) update.enabled = Boolean(enabled);
  if (apiKey !== undefined) update.apiKey = String(apiKey).trim();
  if (senderId !== undefined) update.senderId = String(senderId).trim();
  if (adminAlertPhone !== undefined) update.adminAlertPhone = String(adminAlertPhone).trim();

  if (events && typeof events === 'object') {
    for (const key of SMS_EVENT_KEYS) {
      const incoming = events[key];
      if (incoming && typeof incoming === 'object') {
        if (incoming.enabled !== undefined) {
          update[`events.${key}.enabled`] = Boolean(incoming.enabled);
        }
        if (incoming.template !== undefined) {
          const tpl = String(incoming.template).trim();
          update[`events.${key}.template`] = tpl || DEFAULT_SMS_TEMPLATES[key];
        }
      }
    }
  }

  await SmsSettings.findOneAndUpdate({}, { $set: update }, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
    runValidators: true,
  });

  const effective = await getEffectiveSmsSettings();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'SMS settings saved successfully',
    data: {
      ...effective,
      hasApiKey: Boolean(effective.apiKey),
      defaultTemplates: DEFAULT_SMS_TEMPLATES,
    },
  });
});

// GET /api/v1/settings/sms/balance (admin)
export const checkSmsBalance = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await getEffectiveSmsSettings();
  const result = await getBulkSmsBalance(settings.apiKey);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.success
      ? 'SMS balance retrieved successfully'
      : result.message || 'Could not retrieve SMS balance',
    data: result,
  });
});

// POST /api/v1/settings/sms/test (admin)
export const sendTestSms = asyncHandler(async (req: Request, res: Response) => {
  const { to, message } = req.body;

  if (!to || !String(to).trim()) {
    throw new AppError('Recipient phone number is required', 400);
  }
  const text =
    String(message || '').trim() ||
    'Deshio Test SMS: Your BulkSMSBD gateway integration is working!';

  const result = await sendSms({
    to: String(to).trim(),
    message: text,
    event: 'test_sms',
  });

  sendResponse(res, {
    statusCode: 200,
    success: result.success,
    message:
      result.status === 'sent'
        ? 'Test SMS sent successfully via BulkSMSBD'
        : result.status === 'dry_run'
          ? `Dry-Run recorded: ${result.message}`
          : `SMS failed: ${result.message}`,
    data: result,
  });
});

// GET /api/v1/settings/sms/logs (admin)
export const getSmsLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (req.query.status && ['sent', 'failed', 'dry_run'].includes(String(req.query.status))) {
    filter.status = String(req.query.status);
  }
  if (req.query.event && String(req.query.event).trim()) {
    filter.event = String(req.query.event).trim();
  }

  const [logs, total] = await Promise.all([
    SmsLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    SmsLog.countDocuments(filter),
  ]);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'SMS logs retrieved successfully',
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: logs,
  });
});
