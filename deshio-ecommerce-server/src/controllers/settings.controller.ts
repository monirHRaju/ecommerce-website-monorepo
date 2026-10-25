import { Request, Response } from 'express';
import SiteSettings from '../models/settings.model';
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
