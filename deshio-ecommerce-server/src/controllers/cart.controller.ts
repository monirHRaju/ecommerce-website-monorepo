import { Request, Response } from 'express';
import Cart from '../models/cart.model';
import Product from '../models/product.model';
import { IProduct, IVariant } from '../types';
import AppError from '../utils/AppError';
import asyncHandler from '../utils/asyncHandler';
import sendResponse from '../utils/sendResponse';

const CART_POPULATE_FIELDS = 'title slug images price discount stock brand variants';

const calcTotal = (items: { quantity: number; price: number }[]) =>
  Math.round(items.reduce((sum, item) => sum + item.quantity * item.price, 0) * 100) / 100;

const computeDiscountedUnitPrice = (basePrice: number, discount = 0) =>
  Math.round(basePrice * (1 - discount / 100) * 100) / 100;

/**
 * Resolve variant from product.variants by sku, size+color, or fallback to first available variant.
 */
const resolveVariant = (
  product: IProduct,
  opts: { sku?: string; size?: string; color?: string }
): IVariant | undefined => {
  const variants = product.variants ?? [];
  if (variants.length === 0) return undefined;

  if (opts.sku) {
    const bySku = variants.find((v) => v.sku.toLowerCase() === opts.sku!.trim().toLowerCase());
    if (bySku) return bySku;
  }

  if (opts.size || opts.color) {
    const byAttr = variants.find((v) => {
      const sizeMatch = !opts.size || v.size.toLowerCase() === opts.size.trim().toLowerCase();
      const colorMatch = !opts.color || v.color.toLowerCase() === opts.color.trim().toLowerCase();
      return sizeMatch && colorMatch;
    });
    if (byAttr) return byAttr;
    throw new AppError('Selected size/color combination is unavailable', 400);
  }

  // Fallback for quick-add from listing cards: pick first variant with stock > 0, or first variant
  return variants.find((v) => v.stock > 0) ?? variants[0];
};

// GET /api/v1/cart
const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await Cart.findOne({ userId: req.user!.id }).populate(
    'items.productId',
    CART_POPULATE_FIELDS
  );

  if (!cart) {
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Cart is empty',
      data: { items: [], totalAmount: 0 },
    });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Cart retrieved successfully',
    data: cart,
  });
});

// POST /api/v1/cart  { productId, quantity?, size?, color?, sku? }
const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity = 1, size, color, sku } = req.body;
  const qty = Math.max(1, Number(quantity) || 1);

  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);

  const variant = resolveVariant(product, { sku, size, color });
  const availableStock = variant ? variant.stock : product.stock;
  const resolvedSize = variant?.size ?? size;
  const resolvedColor = variant?.color ?? color;
  const resolvedSku = variant?.sku ?? sku;
  const basePrice = variant?.priceOverride ?? product.price;
  const unitPrice = computeDiscountedUnitPrice(basePrice, product.discount ?? 0);

  if (availableStock < qty) {
    throw new AppError('Insufficient stock for selected option', 400);
  }

  let cart = await Cart.findOne({ userId: req.user!.id });

  if (!cart) {
    cart = await Cart.create({
      userId: req.user!.id,
      items: [
        {
          productId: product._id!,
          quantity: qty,
          price: unitPrice,
          size: resolvedSize,
          color: resolvedColor,
          sku: resolvedSku,
        },
      ],
      totalAmount: Math.round(unitPrice * qty * 100) / 100,
    });
  } else {
    const existingIndex = cart.items.findIndex(
      (item) =>
        String(item.productId) === String(product._id) &&
        (item.size || '') === (resolvedSize || '') &&
        (item.color || '') === (resolvedColor || '')
    );

    if (existingIndex > -1) {
      const nextQty = cart.items[existingIndex].quantity + qty;
      if (availableStock < nextQty) {
        throw new AppError(`Only ${availableStock} in stock for this option`, 400);
      }
      cart.items[existingIndex].quantity = nextQty;
      cart.items[existingIndex].price = unitPrice;
    } else {
      cart.items.push({
        productId: product._id!,
        quantity: qty,
        price: unitPrice,
        size: resolvedSize,
        color: resolvedColor,
        sku: resolvedSku,
      });
    }
    cart.totalAmount = calcTotal(cart.items);
    await cart.save();
  }

  await cart.populate('items.productId', CART_POPULATE_FIELDS);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Item added to cart',
    data: cart,
  });
});

// PATCH /api/v1/cart/:itemId  { quantity }
const updateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const { quantity } = req.body;
  const qty = Number(quantity);
  if (!qty || qty < 1) throw new AppError('Quantity must be at least 1', 400);

  const cart = await Cart.findOne({ userId: req.user!.id });
  if (!cart) throw new AppError('Cart not found', 404);

  const item = cart.items.find((i) => String((i as any)._id) === req.params.itemId);
  if (!item) throw new AppError('Cart item not found', 404);

  const product = await Product.findById(item.productId);
  if (product) {
    const variant = resolveVariant(product, {
      sku: item.sku,
      size: item.size,
      color: item.color,
    });
    const availableStock = variant ? variant.stock : product.stock;
    if (availableStock < qty) {
      throw new AppError(`Insufficient stock (only ${availableStock} available)`, 400);
    }
  }

  item.quantity = qty;
  cart.totalAmount = calcTotal(cart.items);
  await cart.save();
  await cart.populate('items.productId', CART_POPULATE_FIELDS);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Cart updated',
    data: cart,
  });
});

// DELETE /api/v1/cart/:itemId
const removeCartItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await Cart.findOne({ userId: req.user!.id });
  if (!cart) throw new AppError('Cart not found', 404);

  const initialLength = cart.items.length;
  cart.items = cart.items.filter((i) => String((i as any)._id) !== req.params.itemId) as any;

  if (cart.items.length === initialLength) throw new AppError('Cart item not found', 404);

  cart.totalAmount = calcTotal(cart.items);
  await cart.save();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Item removed from cart',
    data: cart,
  });
});

// DELETE /api/v1/cart
const clearCart = asyncHandler(async (req: Request, res: Response) => {
  await Cart.findOneAndUpdate(
    { userId: req.user!.id },
    { items: [], totalAmount: 0 }
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Cart cleared',
  });
});

export const cartControllers = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
