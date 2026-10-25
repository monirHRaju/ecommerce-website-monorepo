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
