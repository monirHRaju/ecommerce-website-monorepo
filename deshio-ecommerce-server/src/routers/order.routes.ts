import express from 'express';
import { orderControllers } from '../controllers/order.controller';
import authenticate from '../middlewares/auth.middleware';
import { createRateLimiter } from '../middlewares/rateLimit.middleware';
import authorize from '../middlewares/role.middleware';

const router = express.Router();

const guestCheckoutLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many order attempts from this IP. Please wait a few minutes and try again.',
});

// Public — guest order tracking (no auth required)
router.get('/track/:orderNumber', orderControllers.trackOrder);

// Public — guest checkout with auto-account creation
router.post('/guest-checkout', guestCheckoutLimiter, orderControllers.guestCheckout);

router.use(authenticate);

router.post('/', orderControllers.createOrder);
router.get('/', orderControllers.getOrders);
router.get('/:id', orderControllers.getOrderById);
router.patch('/:id/status', authorize('admin'), orderControllers.updateOrderStatus);
router.patch('/:id/cancel', orderControllers.cancelOrder);

export const OrderRoutes = router;
