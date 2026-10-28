import { Request, Response } from 'express';
import Cart from '../models/cart.model';
import Order from '../models/order.model';
import Product from '../models/product.model';
import User from '../models/user.model';
import { placeOrder, RawOrderItemInput } from '../services/order.service';
import { JwtPayload } from '../types';
import AppError from '../utils/AppError';
import asyncHandler from '../utils/asyncHandler';
import { sendGuestAccountCredentialsEmail } from '../utils/email';
import { createNotification } from '../utils/notificationService';
import { generateSimplePassword, normalizeBdPhone } from '../utils/phone';
import sendResponse from '../utils/sendResponse';
import { generateTokens } from './auth.controller';

// POST /api/v1/orders  (authenticated user)
const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const {
    shippingAddress,
    phone,
    paymentMethod = 'cash_on_delivery',
    deliveryZoneId,
    couponCode,
    orderNote,
    mobilePayment,
    items: bodyItems,
  } = req.body;

  if (!shippingAddress) throw new AppError('Shipping address is required', 400);
  if (!phone) throw new AppError('Mobile number is required', 400);

  const normalizedPhone = normalizeBdPhone(phone) || String(phone).trim();

  const cart = await Cart.findOne({ userId: req.user!.id });
  const rawItems: RawOrderItemInput[] =
    cart && cart.items.length > 0
      ? cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
          sku: i.sku,
        }))
      : Array.isArray(bodyItems)
      ? bodyItems
      : [];

  if (rawItems.length === 0) throw new AppError('Cart is empty', 400);

  const order = await placeOrder({
    userId: req.user!.id,
    rawItems,
    shippingAddress,
    phone: normalizedPhone,
    paymentMethod,
    deliveryZoneId,
    couponCode,
    orderNote,
    mobilePayment,
  });

  // Save phone & shipping address to user profile if missing
  await User.findByIdAndUpdate(req.user!.id, {
    $set: {
      phone: normalizedPhone,
      address: shippingAddress,
    },
  }).catch(() => {});

  // Clear cart after order
  await Cart.findOneAndUpdate({ userId: req.user!.id }, { items: [], totalAmount: 0 });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Order placed successfully',
    data: order,
  });
});

// POST /api/v1/orders/guest-checkout  (public — no login required)
const guestCheckout = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    email,
    phone,
    shippingAddress,
    items,
    paymentMethod = 'cash_on_delivery',
    deliveryZoneId,
    couponCode,
    orderNote,
    mobilePayment,
  } = req.body;

  const customerName = String(name || '').trim() || 'Valued Customer';
  const normalizedPhone = normalizeBdPhone(phone);
  if (!normalizedPhone) {
    throw new AppError('Please enter a valid 11-digit Bangladesh mobile number (e.g. 017XXXXXXXX)', 400);
  }
  if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
    throw new AppError('Shipping address is required', 400);
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('Your shopping bag is empty', 400);
  }

  const rawEmail = email ? String(email).trim().toLowerCase() : '';
  const hasValidRealEmail = Boolean(rawEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail));

  // Check if an account already exists with this phone number (or provided email)
  const existingUser = await User.findOne({
    $or: [
      { phone: normalizedPhone },
      { phone: String(phone).trim() },
      { phone: `+88${normalizedPhone}` },
      { phone: `88${normalizedPhone}` },
      { email: `${normalizedPhone}@guest.local` },
      ...(hasValidRealEmail ? [{ email: rawEmail }] : []),
    ],
  });

  if (existingUser) {
    // Attach order to existing user account without resetting password or auto-logging in
    const order = await placeOrder({
      userId: existingUser._id!,
      rawItems: items,
      shippingAddress,
      phone: normalizedPhone,
      paymentMethod,
      deliveryZoneId,
      couponCode,
      orderNote,
      mobilePayment,
    });

    // Update address & phone if missing on existing user
    const updates: Record<string, any> = { address: shippingAddress };
    if (!existingUser.phone) updates.phone = normalizedPhone;
    await User.findByIdAndUpdate(existingUser._id, { $set: updates }).catch(() => {});

    return sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Order placed successfully! Associated with your existing account.',
      data: {
        order,
        accountCreated: false,
        existingAccount: true,
        loginIdentifier: normalizedPhone,
      },
    });
  }

  // New customer → auto-create account with a 6-digit numeric password
  const generatedPassword = generateSimplePassword();
  let finalEmail = `${normalizedPhone}@guest.local`;
  let isGuestEmail = true;

  if (hasValidRealEmail) {
    const emailConflict = await User.findOne({ email: rawEmail });
    if (!emailConflict) {
      finalEmail = rawEmail;
      isGuestEmail = false;
    }
  }

  const newUser = await User.create({
    name: customerName,
    email: finalEmail,
    phone: normalizedPhone,
    password: generatedPassword,
    role: 'user',
    address: shippingAddress,
    isVerified: true,
    autoGenerated: true,
    isGuestEmail,
  });

  // Notification: new user auto-registered
  createNotification({
    type: 'user',
    title: 'New Customer Auto-Registered',
    message: `${newUser.name} (${normalizedPhone}) registered via quick checkout`,
    referenceId: newUser._id,
    referenceModel: 'User',
  }).catch(console.error);

  // Place the order under the new user's ID (if order fails, remove the newly created user cleanly)
  let order;
  try {
    order = await placeOrder({
      userId: newUser._id!,
      rawItems: items,
      shippingAddress,
      phone: normalizedPhone,
      paymentMethod,
      deliveryZoneId,
      couponCode,
      orderNote,
      mobilePayment,
    });
  } catch (err) {
    await User.findByIdAndDelete(newUser._id).catch(() => {});
    throw err;
  }

  // Send email with login credentials if customer provided a real email address
  if (!isGuestEmail) {
    sendGuestAccountCredentialsEmail({
      name: customerName,
      email: finalEmail,
      phone: normalizedPhone,
      password: generatedPassword,
      orderNumber: order.orderNumber || '',
      totalAmount: order.totalAmount,
    }).catch((err) => {
      console.error('[Email] Guest credentials email failed:', err.message);
    });
  }

  // Generate JWT tokens for instant auto-login on the client
  const payload: JwtPayload = {
    id: String(newUser._id),
    email: newUser.email,
    role: newUser.role,
  };
  const { accessToken, refreshToken } = generateTokens(payload);

  const userObj = newUser.toObject();
  delete userObj.password;

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Order placed & account created successfully!',
    data: {
      order,
      accountCreated: true,
      existingAccount: false,
      generatedPassword,
      loginIdentifier: normalizedPhone,
      user: userObj,
      accessToken,
      refreshToken,
    },
  });
});

// GET /api/v1/orders  (user: own orders | admin: all orders)
const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (req.user!.role !== 'admin' && req.user!.role !== 'super-admin') filter.userId = req.user!.id;
  if (req.query.status) filter.orderStatus = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('userId', 'name email phone avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Orders retrieved successfully',
    data: orders,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// GET /api/v1/orders/:id
const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id).populate('userId', 'name email phone');
  if (!order) throw new AppError('Order not found', 404);

  const isOwner = String(order.userId) === req.user!.id;
  if (!isOwner && req.user!.role !== 'admin' && req.user!.role !== 'super-admin') {
    throw new AppError('Not authorized to view this order', 403);
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Order retrieved successfully',
    data: order,
  });
});

// PATCH /api/v1/orders/:id/status  (admin)
const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { orderStatus, paymentStatus } = req.body;

  const update: Record<string, any> = {};
  if (orderStatus) update.orderStatus = orderStatus;
  if (paymentStatus) update.paymentStatus = paymentStatus;

  const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!order) throw new AppError('Order not found', 404);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Order status updated',
    data: order,
  });
});

// PATCH /api/v1/orders/:id/cancel  (user — pending orders only)
const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);

  if (String(order.userId) !== req.user!.id) {
    throw new AppError('Not authorized to cancel this order', 403);
  }
  if (order.orderStatus !== 'pending') {
    throw new AppError('Only pending orders can be cancelled', 400);
  }

  // Restore variant & product stock
  for (const item of order.items) {
    if (item.sku) {
      await Product.updateOne(
        { _id: item.productId, 'variants.sku': item.sku },
        {
          $inc: {
            'variants.$.stock': item.quantity,
            stock: item.quantity,
            sold: -item.quantity,
          },
        }
      );
    } else {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity, sold: -item.quantity },
      });
    }
  }

  order.orderStatus = 'cancelled';
  await order.save();

  // Notification: order cancelled
  createNotification({
    type: 'order',
    title: 'Order Cancelled',
    message: `Order ${order.orderNumber} was cancelled by the customer`,
    referenceId: order._id,
    referenceModel: 'Order',
  }).catch(console.error);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Order cancelled successfully',
    data: order,
  });
});

// GET /api/v1/orders/track/:orderNumber  (public — no auth, limited info)
const trackOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findOne({ orderNumber: String(req.params.orderNumber).toUpperCase() })
    .populate('deliveryZoneId', 'name charge estimatedDays');

  if (!order) throw new AppError('Order not found. Please check your order number.', 404);

  const tracking = {
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    totalAmount: order.totalAmount,
    deliveryCharge: order.deliveryCharge,
    couponDiscount: order.couponDiscount,
    orderNote: order.orderNote,
    deliveryZone: order.deliveryZoneId,
    items: order.items.map((i) => ({
      title: i.title,
      quantity: i.quantity,
      image: i.image,
      price: i.price,
      size: i.size,
      color: i.color,
      sku: i.sku,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Order tracking info retrieved',
    data: tracking,
  });
});

export const orderControllers = {
  createOrder,
  guestCheckout,
  getOrders,
  getOrderById,
  trackOrder,
  updateOrderStatus,
  cancelOrder,
};
