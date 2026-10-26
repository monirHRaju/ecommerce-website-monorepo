import { Request, Response } from 'express';
import Cart from '../models/cart.model';
import Coupon from '../models/coupon.model';
import DeliveryZone from '../models/deliveryZone.model';
import Order from '../models/order.model';
import PaymentMethod from '../models/paymentMethod.model';
import Product from '../models/product.model';
import User from '../models/user.model';
import { IOrderItem, IVariant } from '../types';
import AppError from '../utils/AppError';
import asyncHandler from '../utils/asyncHandler';
import { createNotification, LOW_STOCK_THRESHOLD } from '../utils/notificationService';
import sendResponse from '../utils/sendResponse';

// POST /api/v1/orders  { shippingAddress, paymentMethod, deliveryZoneId?, couponCode?, orderNote? }
const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const {
    shippingAddress,
    phone,
    paymentMethod = 'card',
    deliveryZoneId,
    couponCode,
    orderNote,
    mobilePayment,
  } = req.body;
  if (!shippingAddress) throw new AppError('Shipping address is required', 400);
  if (!phone) throw new AppError('Mobile number is required', 400);

  // Require verified email to place orders
  const buyer = await User.findById(req.user!.id);
  if (!buyer?.isVerified) {
    throw new AppError('Please verify your email address before placing orders.', 403);
  }

  const cart = await Cart.findOne({ userId: req.user!.id }).populate<{
    items: {
      productId: any;
      quantity: number;
      price: number;
      size?: string;
      color?: string;
      sku?: string;
    }[];
  }>('items.productId');

  if (!cart || cart.items.length === 0) throw new AppError('Cart is empty', 400);

  // Build order items and atomically decrement stock (with rollback if a later item fails)
  const orderItems: IOrderItem[] = [];
  const decremented: { productId: any; sku?: string; quantity: number }[] = [];

  try {
    for (const item of cart.items) {
      const product = item.productId;
      if (!product) throw new AppError('Product not found in cart', 404);

      const variants: IVariant[] = product.variants ?? [];
      let matchedVariant: IVariant | undefined;

      if (variants.length > 0) {
        matchedVariant =
          (item.sku && variants.find((v) => v.sku === item.sku)) ||
          variants.find(
            (v) =>
              (!item.size || v.size.toLowerCase() === item.size.toLowerCase()) &&
              (!item.color || v.color.toLowerCase() === item.color.toLowerCase())
          ) ||
          variants.find((v) => v.stock >= item.quantity);

        if (!matchedVariant) {
          throw new AppError(`Selected option for "${product.title}" is out of stock`, 400);
        }

        const updated = await Product.findOneAndUpdate(
          {
            _id: product._id,
            'variants.sku': matchedVariant.sku,
            'variants.stock': { $gte: item.quantity },
          },
          {
            $inc: {
              'variants.$.stock': -item.quantity,
              stock: -item.quantity,
              sold: item.quantity,
            },
          },
          { new: true }
        );

        if (!updated) {
          throw new AppError(
            `Insufficient stock for "${product.title}" (${matchedVariant.size} / ${matchedVariant.color})`,
            400
          );
        }
        decremented.push({ productId: product._id, sku: matchedVariant.sku, quantity: item.quantity });
      } else {
        const updated = await Product.findOneAndUpdate(
          { _id: product._id, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity, sold: item.quantity } },
          { new: true }
        );
        if (!updated) {
          throw new AppError(`Insufficient stock for "${product.title}"`, 400);
        }
        decremented.push({ productId: product._id, quantity: item.quantity });
      }

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: item.price,
        title: product.title,
        image: product.images?.[0] || '',
        size: matchedVariant?.size ?? item.size,
        color: matchedVariant?.color ?? item.color,
        sku: matchedVariant?.sku ?? item.sku,
      });
    }
  } catch (err) {
    // Rollback any decrements already applied
    for (const d of decremented) {
      if (d.sku) {
        await Product.updateOne(
          { _id: d.productId, 'variants.sku': d.sku },
          { $inc: { 'variants.$.stock': d.quantity, stock: d.quantity, sold: -d.quantity } }
        );
      } else {
        await Product.updateOne(
          { _id: d.productId },
          { $inc: { stock: d.quantity, sold: -d.quantity } }
        );
      }
    }
    throw err;
  }

  const itemsTotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // ── Delivery zone ──────────────────────────────────────────────────────────
  let deliveryCharge = 0;
  let resolvedDeliveryZoneId: any = undefined;
  if (deliveryZoneId) {
    const zone = await DeliveryZone.findById(deliveryZoneId);
    if (!zone || !zone.isActive) throw new AppError('Selected delivery zone is unavailable', 400);
    deliveryCharge = zone.charge;
    resolvedDeliveryZoneId = zone._id;
  }

  // ── Coupon ─────────────────────────────────────────────────────────────────
  let couponDiscount = 0;
  let appliedCouponCode: string | undefined;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
    if (!coupon || !coupon.isActive) throw new AppError('Invalid or inactive coupon code', 400);
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new AppError('Coupon has expired', 400);
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses)
      throw new AppError('Coupon usage limit reached', 400);
    if (itemsTotal < coupon.minOrderAmount)
      throw new AppError(`Minimum order amount for this coupon is ${coupon.minOrderAmount}`, 400);

    couponDiscount =
      coupon.type === 'percent'
        ? Math.min((itemsTotal * coupon.value) / 100, itemsTotal)
        : Math.min(coupon.value, itemsTotal);
    appliedCouponCode = coupon.code;

    // Increment usage count
    await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
  }

  // ── COD processing fee ─────────────────────────────────────────────────────
  const codProcessingFee = paymentMethod === 'cash_on_delivery' ? 20 : 0;

  const totalAmount = Math.max(
    0,
    Math.round((itemsTotal + deliveryCharge - couponDiscount + codProcessingFee) * 100) / 100
  );

  // ── Mobile payment validation ───────────────────────────────────────────────
  let resolvedMobilePayment: Record<string, any> | undefined;
  if (paymentMethod === 'mobile_banking') {
    if (
      !mobilePayment?.paymentMethodId ||
      !mobilePayment?.mobileLast4 ||
      !mobilePayment?.transactionId
    ) {
      throw new AppError(
        'Mobile payment details (payment method, last 4 digits, transaction ID) are required',
        400
      );
    }
    if (!/^\d{4}$/.test(mobilePayment.mobileLast4)) {
      throw new AppError('Mobile last 4 digits must be exactly 4 digits', 400);
    }
    const method = await PaymentMethod.findById(mobilePayment.paymentMethodId);
    if (!method || !method.isActive) throw new AppError('Selected payment method is unavailable', 400);
    resolvedMobilePayment = {
      paymentMethodId: method._id,
      paymentMethodName: method.name,
      mobileLast4: mobilePayment.mobileLast4,
      transactionId: mobilePayment.transactionId.trim(),
    };
  }

  const order = await Order.create({
    userId: req.user!.id,
    items: orderItems,
    totalAmount,
    shippingAddress,
    phone,
    paymentMethod,
    deliveryZoneId: resolvedDeliveryZoneId,
    deliveryCharge,
    codProcessingFee,
    couponCode: appliedCouponCode,
    couponDiscount,
    orderNote: orderNote || undefined,
    mobilePayment: resolvedMobilePayment,
  });

  // Notification: new order placed
  createNotification({
    type: 'order',
    title: 'New Order Placed',
    message: `Order ${order.orderNumber} placed for ৳${order.totalAmount.toLocaleString()}`,
    referenceId: order._id,
    referenceModel: 'Order',
  }).catch(console.error);

  // Notification: low stock alerts
  for (const item of orderItems) {
    const updatedProduct = await Product.findById(item.productId).select('stock title');
    if (updatedProduct && updatedProduct.stock <= LOW_STOCK_THRESHOLD) {
      createNotification({
        type: 'product',
        title: 'Low Stock Alert',
        message: `"${updatedProduct.title}" has only ${updatedProduct.stock} units remaining`,
        referenceId: updatedProduct._id,
        referenceModel: 'Product',
      }).catch(console.error);
    }
  }

  // Clear cart after order
  await Cart.findOneAndUpdate({ userId: req.user!.id }, { items: [], totalAmount: 0 });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Order placed successfully',
    data: order,
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
      .populate('userId', 'name email avatar')
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
  const order = await Order.findById(req.params.id).populate('userId', 'name email');
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

  // Return only tracking-relevant info — omit shippingAddress and userId for privacy
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
  getOrders,
  getOrderById,
  trackOrder,
  updateOrderStatus,
  cancelOrder,
};
