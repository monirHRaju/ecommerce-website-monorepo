import express from 'express';
import {
  getPublicTrackingSettings,
  ingestBrowserTrackingEvent,
} from '../controllers/tracking.controller';

const router = express.Router();

// GET /api/v1/tracking/config (public)
router.get('/config', getPublicTrackingSettings);

// POST /api/v1/tracking/event (public — browser CAPI event forwarding)
router.post('/event', ingestBrowserTrackingEvent);

export const TrackingRoutes = router;
