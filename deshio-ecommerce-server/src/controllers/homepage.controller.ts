import { Request, Response } from 'express';
import config from '../config';
import HomepageSettings, {
  DEFAULT_HOME_SECTIONS,
  HOME_SECTION_TYPES,
  HomeSectionType,
  IHomeSection,
} from '../models/homepageSettings.model';
import AppError from '../utils/AppError';
import asyncHandler from '../utils/asyncHandler';
import sendResponse from '../utils/sendResponse';

async function getOrCreate() {
  let doc = await HomepageSettings.findOne().lean();
  if (!doc) {
    doc = (await HomepageSettings.create({})).toObject();
  }
  return doc;
}

/** Asks the storefront to drop its cached homepage data (best-effort). */
function revalidateStorefront() {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return;
  fetch(`${config.client_url}/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, tags: ['homepage-settings'] }),
  }).catch(() => {});
}

// GET /api/v1/settings/homepage (public)
export const getHomepageSettings = asyncHandler(async (_req: Request, res: Response) => {
  const doc = await getOrCreate();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Homepage settings retrieved successfully',
    data: doc,
  });
});

// PATCH /api/v1/settings/homepage (admin)
export const updateHomepageSettings = asyncHandler(async (req: Request, res: Response) => {
  const { banner, sections, reset } = req.body;
  const update: Record<string, any> = {};

  if (reset === true) {
    update.sections = DEFAULT_HOME_SECTIONS;
  }

  if (banner && typeof banner === 'object') {
    if (banner.enabled !== undefined) update['banner.enabled'] = Boolean(banner.enabled);
    if (banner.image !== undefined) update['banner.image'] = String(banner.image).trim();
    if (banner.mobileImage !== undefined)
      update['banner.mobileImage'] = String(banner.mobileImage).trim();
    if (banner.link !== undefined) update['banner.link'] = String(banner.link).trim();
    if (banner.alt !== undefined) update['banner.alt'] = String(banner.alt).trim();
  }

  if (Array.isArray(sections)) {
    const seen = new Set<string>();
    const clean: IHomeSection[] = sections.map((s: any, index: number) => {
      const type = String(s?.type) as HomeSectionType;
      if (!HOME_SECTION_TYPES.includes(type)) {
        throw new AppError(`Invalid section type: ${s?.type}`, 400);
      }
      const title = String(s?.title || '').trim();
      if (!title) throw new AppError('Every section needs a title', 400);

      let key = String(s?.key || '').trim() || `${type}-${index + 1}`;
      while (seen.has(key)) key = `${key}-${index + 1}`;
      seen.add(key);

      const value = String(s?.value || '').trim();
      if ((type === 'gender' || type === 'category') && !value) {
        throw new AppError(`Section "${title}" needs a ${type === 'gender' ? 'gender' : 'category'} value`, 400);
      }

      return {
        key,
        type,
        title,
        enabled: Boolean(s?.enabled),
        order: index + 1,
        limit: Math.min(24, Math.max(1, Number(s?.limit) || 8)),
        value,
      };
    });
    update.sections = clean;
  }

  await HomepageSettings.findOneAndUpdate({}, { $set: update }, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
    runValidators: true,
  });

  revalidateStorefront();

  const doc = await getOrCreate();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Homepage settings saved successfully',
    data: doc,
  });
});
