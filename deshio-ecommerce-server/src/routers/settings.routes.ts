import express from 'express';
import { getSeoSettings, updateSeoSettings } from '../controllers/settings.controller';
import authenticate from '../middlewares/auth.middleware';
import authorize from '../middlewares/role.middleware';

const router = express.Router();

// GET /api/v1/settings/seo (public)
router.get('/seo', getSeoSettings);

// PATCH /api/v1/settings/seo (admin only)
router.patch('/seo', authenticate, authorize('admin', 'super-admin'), updateSeoSettings);

// GET /api/v1/settings/support (public alias)
router.get('/support', getSeoSettings);

// PATCH /api/v1/settings/support (admin only)
router.patch('/support', authenticate, authorize('admin', 'super-admin'), updateSeoSettings);

// GET /api/v1/settings/website (public)
router.get('/website', getSeoSettings);

// PATCH /api/v1/settings/website (admin only)
router.patch('/website', authenticate, authorize('admin', 'super-admin'), updateSeoSettings);

// GET /api/v1/settings/pages (public)
router.get('/pages', getSeoSettings);

// PATCH /api/v1/settings/pages (admin only)
router.patch('/pages', authenticate, authorize('admin', 'super-admin'), updateSeoSettings);

// GET /api/v1/settings/public (public)
router.get('/public', getSeoSettings);

export const SettingsRoutes = router;
