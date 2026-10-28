import express from 'express';
import {
  checkSmsBalance,
  getSeoSettings,
  getSmsLogs,
  getSmsSettings,
  sendTestSms,
  updateSeoSettings,
  updateSmsSettings,
} from '../controllers/settings.controller';
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

// ─── SMS Gateway & Logs (Admin only) ─────────────────────────────────────────
router.get('/sms', authenticate, authorize('admin', 'super-admin'), getSmsSettings);
router.patch('/sms', authenticate, authorize('admin', 'super-admin'), updateSmsSettings);
router.get('/sms/balance', authenticate, authorize('admin', 'super-admin'), checkSmsBalance);
router.post('/sms/test', authenticate, authorize('admin', 'super-admin'), sendTestSms);
router.get('/sms/logs', authenticate, authorize('admin', 'super-admin'), getSmsLogs);

export const SettingsRoutes = router;
