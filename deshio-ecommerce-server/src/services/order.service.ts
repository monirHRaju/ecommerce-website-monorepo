import { Types } from 'mongoose';
import Coupon from '../models/coupon.model';
import DeliveryZone from '../models/deliveryZone.model';
import Order from '../models/order.model';
import PaymentMethod from '../models/paymentMethod.model';
import Product from '../models/product.model';
import { IAddress, IOrderItem, IVariant } from '../types';
import AppError from '../utils/AppError';
import { createNotification, LOW_STOCK_THRESHOLD } from '../utils/notificationService';

export interface RawOrderItemInput {
  productId: Types.ObjectId | string;
  quantity: number;
  size?: string;
  color?: string;
  sku?: string;
}

export interface PlaceOrderInput {
  userId: Types.ObjectId | string;
  rawItems: RawOrderItemInput[];
  shippingAddress: IAddress;
  phone: string;
  paymentMethod?: string;
  deliveryZoneId?: string;
  couponCode?: string;
  orderNote?: string;
  mobilePayment?: {
    paymentMethodId?: string;
    mobileLast4?: string;
    transactionId?: string;
  };
}

const computeDiscountedUnitPrice = (basePrice: number, discount = 0) =>
  Math.round(basePrice * (1 - discount / 100) * 100) / 100;

/**
 * Validates items against DB, decrements stock atomically (with rollback on error),
 * applies delivery zone & coupon, creates the Order document, and emits notifications.
 */
export async function placeOrder(input: PlaceOrderInput) {
  const {
    userId,
    rawItems,
    shippingAddress,
    phone,
    paymentMethod = 'cash_on_delivery',
    deliveryZoneId,
    couponCode,
    orderNote,
    mobilePayment,
  } = input;

  if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
    throw new AppError('Shipping address is required', 400);
  }
  if (!phone) {
    throw new AppError('Mobile number is required', 400);
  }
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  const orderItems: IOrderItem[] = [];
  const decremented: { productId: any; sku?: string; quantity: number }[] = [];

  try {
    for (const item of rawItems) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const product = await Product.findById(item.productId);
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
          variants.find((v) => v.stock >= qty);

        if (!matchedVariant) {
          throw new AppError(`Selected option for "${product.title}" is out of stock`, 400);
        }

        const updated = await Product.findOneAndUpdate(
          {
            _id: product._id,
            'variants.sku': matchedVariant.sku,
            'variants.stock': { $gte: qty },
          },
          {
            $inc: {
              'variants.$.stock': -qty,
              stock: -qty,
              sold: qty,
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
        decremented.push({ productId: product._id, sku: matchedVariant.sku, quantity: qty });
      } else {
        const updated = await Product.findOneAndUpdate(
          { _id: product._id, stock: { $gte: qty } },
          { $inc: { stock: -qty, sold: qty } },
          { new: true }
        );
        if (!updated) {
          throw new AppError(`Insufficient stock for "${product.title}"`, 400);
        }
        decremented.push({ productId: product._id, quantity: qty });
      }

      const basePrice = matchedVariant?.priceOverride ?? product.price;
      const unitPrice = computeDiscountedUnitPrice(basePrice, product.discount ?? 0);

      orderItems.push({
        productId: product._id!,
        quantity: qty,
        price: unitPrice,
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
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      throw new AppError('Coupon usage limit reached', 400);
    }
    if (itemsTotal < coupon.minOrderAmount) {
      throw new AppError(`Minimum order amount for this coupon is ${coupon.minOrderAmount}`, 400);
    }

    couponDiscount =
      coupon.type === 'percent'
        ? Math.min((itemsTotal * coupon.value) / 100, itemsTotal)
        : Math.min(coupon.value, itemsTotal);
    appliedCouponCode = coupon.code;

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
    userId: new Types.ObjectId(String(userId)),
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

  return order;
}
