import { Request, Response } from 'express';
import Cart from '../models/cart.model';
import Order from '../models/order.model';
import Product from '../models/product.model';
import { SmsEventKey } from '../models/smsSettings.model';
import User from '../models/user.model';
import { placeOrder, RawOrderItemInput } from '../services/order.service';
import { sendAdminOrderAlertSms, sendEventSms } from '../services/sms/sms.service';
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
  const buyer = await User.findById(req.user!.id);

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

  // Fire-and-forget SMS: Order Placed + optional Admin Alert
  sendEventSms(
    'order_placed',
    normalizedPhone,
    {
      name: buyer?.name || 'Customer',
      phone: normalizedPhone,
      orderNumber: order.orderNumber || '',
      total: order.totalAmount,
    },
    { orderId: order._id, userId: req.user!.id }
  ).catch(console.error);

  sendAdminOrderAlertSms({
    orderId: order._id,
    orderNumber: order.orderNumber || '',
    totalAmount: order.totalAmount,
    customerName: buyer?.name || 'Customer',
    customerPhone: normalizedPhone,
  }).catch(console.error);

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

    // Fire-and-forget SMS: Order Placed (no new password) + optional Admin Alert
    sendEventSms(
      'order_placed',
      normalizedPhone,
      {
        name: existingUser.name || customerName,
        phone: normalizedPhone,
        orderNumber: order.orderNumber || '',
        total: order.totalAmount,
      },
      { orderId: order._id, userId: existingUser._id }
    ).catch(console.error);

    sendAdminOrderAlertSms({
      orderId: order._id,
      orderNumber: order.orderNumber || '',
      totalAmount: order.totalAmount,
      customerName: existingUser.name || customerName,
      customerPhone: normalizedPhone,
    }).catch(console.error);

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

  // Fire-and-forget SMS: 1) Account Credentials SMS + 2) Order Placed SMS + 3) Admin Alert SMS
  sendEventSms(
    'account_created',
    normalizedPhone,
    {
      name: customerName,
      phone: normalizedPhone,
      password: generatedPassword,
      orderNumber: order.orderNumber || '',
      total: order.totalAmount,
    },
    { orderId: order._id, userId: newUser._id }
  ).catch(console.error);

  sendEventSms(
    'order_placed',
    normalizedPhone,
    {
      name: customerName,
      phone: normalizedPhone,
      password: generatedPassword,
      orderNumber: order.orderNumber || '',
      total: order.totalAmount,
    },
    { orderId: order._id, userId: newUser._id }
  ).catch(console.error);

  sendAdminOrderAlertSms({
    orderId: order._id,
    orderNumber: order.orderNumber || '',
    totalAmount: order.totalAmount,
    customerName,
    customerPhone: normalizedPhone,
  }).catch(console.error);

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

const STATUS_TO_SMS_EVENT: Partial<Record<string, SmsEventKey>> = {
  processing: 'order_processing',
  shipped: 'order_shipped',
  delivered: 'order_delivered',
  cancelled: 'order_cancelled',
};

// PATCH /api/v1/orders/:id/status  (admin)
const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { orderStatus, paymentStatus } = req.body;

  const existingOrder = await Order.findById(req.params.id).populate<{
    userId: { _id: any; name?: string; phone?: string };
  }>('userId', 'name phone');
  if (!existingOrder) throw new AppError('Order not found', 404);

  const previousStatus = existingOrder.orderStatus;

  const update: Record<string, any> = {};
  if (orderStatus) update.orderStatus = orderStatus;
  if (paymentStatus) update.paymentStatus = paymentStatus;

  const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!order) throw new AppError('Order not found', 404);

  // Trigger automated SMS if orderStatus changed to processing / shipped / delivered / cancelled
  if (orderStatus && orderStatus !== previousStatus) {
    const smsEvent = STATUS_TO_SMS_EVENT[String(orderStatus)];
    const recipientPhone = order.phone || existingOrder.userId?.phone;
    if (smsEvent && recipientPhone) {
      sendEventSms(
        smsEvent,
        recipientPhone,
        {
          name: existingOrder.userId?.name || 'Customer',
          phone: recipientPhone,
          orderNumber: order.orderNumber || '',
          total: order.totalAmount,
          status: String(orderStatus),
        },
        {
          orderId: order._id,
          userId: existingOrder.userId?._id,
        }
      ).catch(console.error);
    }
  }

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

  // Fire-and-forget SMS: Order Cancelled
  if (order.phone) {
    sendEventSms(
      'order_cancelled',
      order.phone,
      {
        phone: order.phone,
        orderNumber: order.orderNumber || '',
        total: order.totalAmount,
        status: 'cancelled',
      },
      { orderId: order._id, userId: order.userId }
    ).catch(console.error);
  }

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
