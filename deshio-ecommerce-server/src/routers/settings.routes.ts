import express from 'express';
import { getSeoSettings, updateSeoSettings } from '../controllers/settings.controller';
import authenticate from '../middlewares/auth.middleware';
import authorize from '../middlewares/role.middleware';

const router = express.Router();

// GET /api/v1/settings/seo (public)
router.get('/seo', getSeoSettings);

// PATCH /api/v1/settings/seo (admin only)
router.patch('/seo', authenticate, authorize('admin', 'super-admin'), updateSeoSettings);

export const SettingsRoutes = router;
