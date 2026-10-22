import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Category from '../models/category.model';
import Product from '../models/product.model';
import User from '../models/user.model';
import AppError from '../utils/AppError';
import asyncHandler from '../utils/asyncHandler';
import sendResponse from '../utils/sendResponse';
import { escapeRegex, slugify } from '../utils/slugify';

// POST /api/v1/products
const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const productData = { ...req.body, createdBy: req.user!.id };
  const product = await Product.create(productData);
  const populated = await product.populate('category', 'name slug');

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Product created successfully',
    data: populated,
  });
});

// GET /api/v1/products
const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 12));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  // Search — safe regex for partial/substring matching (case-insensitive)
  if (req.query.search) {
    const safe = escapeRegex(String(req.query.search).trim());
    const regex = { $regex: safe, $options: 'i' };
    filter.$or = [{ title: regex }, { description: regex }, { brand: regex }, { tags: regex }];
  }

  // Category filter — accepts ObjectId or slug, and includes direct child categories
  if (req.query.category) {
    const catParam = String(req.query.category).trim();
    const catDoc = Types.ObjectId.isValid(catParam)
      ? await Category.findById(catParam).select('_id').lean()
      : await Category.findOne({ slug: catParam.toLowerCase() }).select('_id').lean();

    if (catDoc) {
      const children = await Category.find({ parentCategory: catDoc._id }).select('_id').lean();
      if (children.length > 0) {
        filter.category = { $in: [catDoc._id, ...children.map((c) => c._id)] };
      } else {
        filter.category = catDoc._id;
      }
    } else if (Types.ObjectId.isValid(catParam)) {
      filter.category = catParam;
    } else {
      // Unknown category slug → return empty result cleanly
      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Products retrieved successfully',
        data: [],
        meta: { page, limit, total: 0, totalPages: 0 },
      });
    }
  }

  // Fashion & catalog filters
  if (req.query.gender) {
    const g = String(req.query.gender).toLowerCase();
    if (['men', 'women', 'kids', 'unisex'].includes(g)) {
      filter.gender = g === 'unisex' ? 'unisex' : { $in: [g, 'unisex'] };
    }
  }
  if (req.query.size) {
    filter['variants.size'] = { $regex: `^${escapeRegex(String(req.query.size).trim())}$`, $options: 'i' };
  }
  if (req.query.color) {
    filter['variants.color'] = { $regex: `^${escapeRegex(String(req.query.color).trim())}$`, $options: 'i' };
  }
  if (req.query.brand) {
    filter.brand = { $regex: escapeRegex(String(req.query.brand).trim()), $options: 'i' };
  }
  if (req.query.isFeatured) {
    filter.isFeatured = req.query.isFeatured === 'true';
  }
  if (req.query.inStock === 'true') {
    filter.stock = { $gt: 0 };
  }
  if (req.query.priceMin || req.query.priceMax) {
    filter.price = {};
    if (req.query.priceMin) filter.price.$gte = Number(req.query.priceMin);
    if (req.query.priceMax) filter.price.$lte = Number(req.query.priceMax);
  }
  if (req.query.rating) {
    filter.rating = { $gte: Number(req.query.rating) };
  }

  // Sorting
  let sortOption: Record<string, any> = { createdAt: -1 };
  if (req.query.sort) {
    const sortStr = String(req.query.sort);
    if (sortStr === 'price') sortOption = { price: 1 };
    else if (sortStr === '-price') sortOption = { price: -1 };
    else if (sortStr === 'rating' || sortStr === '-rating') sortOption = { rating: -1 };
    else if (sortStr === '-createdAt') sortOption = { createdAt: -1 };
    else if (sortStr === 'createdAt') sortOption = { createdAt: 1 };
    else if (sortStr === '-sold') sortOption = { sold: -1 };
    else if (sortStr === '-discount') sortOption = { discount: -1 };
    else if (sortStr === 'title') sortOption = { title: 1 };
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .populate('createdBy', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Products retrieved successfully',
    data: products,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// GET /api/v1/products/featured
const getFeaturedProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await Product.find({ isFeatured: true })
    .populate('category', 'name slug')
    .sort({ rating: -1 })
    .limit(8)
    .lean();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Featured products retrieved successfully',
    data: products,
  });
});

// GET /api/v1/products/slugs — lightweight list for sitemap & generateStaticParams
const getProductSlugs = asyncHandler(async (_req: Request, res: Response) => {
  const items = await Product.find({}, { _id: 1, slug: 1, updatedAt: 1 })
    .sort({ updatedAt: -1 })
    .limit(1000)
    .lean();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product slugs retrieved successfully',
    data: items,
  });
});

// GET /api/v1/products/:id — resolves by slug first, then ObjectId fallback
const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const param = String(req.params.id).trim();

  let product = await Product.findOne({ slug: param.toLowerCase() })
    .populate('category', 'name slug')
    .populate('createdBy', 'name avatar')
    .lean();

  if (!product && Types.ObjectId.isValid(param)) {
    product = await Product.findById(param)
      .populate('category', 'name slug')
      .populate('createdBy', 'name avatar')
      .lean();
  }

  if (!product) throw new AppError('Product not found', 404);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product retrieved successfully',
    data: product,
  });
});

// PATCH /api/v1/products/:id
const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);

  // Only admin or product owner can update
  const isOwner = String(product.createdBy) === req.user!.id;
  if (!isOwner && req.user!.role !== 'admin' && req.user!.role !== 'super-admin') {
    throw new AppError('Not authorized to update this product', 403);
  }

  const updateBody = { ...req.body };

  // Normalize custom slug if provided
  if (typeof updateBody.slug === 'string' && updateBody.slug.trim()) {
    updateBody.slug = slugify(updateBody.slug);
  }

  // Recompute total stock and variant SKUs when variants are provided
  if (Array.isArray(updateBody.variants) && updateBody.variants.length > 0) {
    const slugBase = updateBody.slug || product.slug || slugify(updateBody.title || product.title) || 'item';
    updateBody.variants = updateBody.variants.map((v: any) => ({
      ...v,
      sku:
        v.sku ||
        `${slugBase}-${v.size}-${v.color}`
          .toUpperCase()
          .replace(/[^\p{L}\p{N}]+/gu, '-'),
      stock: Math.max(0, Number(v.stock) || 0),
    }));
    updateBody.stock = updateBody.variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, updateBody, {
    new: true,
    runValidators: true,
  }).populate('category', 'name slug');

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product updated successfully',
    data: updated,
  });
});

// DELETE /api/v1/products/:id
const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError('Product not found', 404);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product deleted successfully',
  });
});

// POST /api/v1/products/:id/wishlist  (toggle)
const toggleWishlist = asyncHandler(async (req: Request, res: Response) => {
  const productId = req.params.id;
  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);

  const user = await User.findById(req.user!.id);
  if (!user) throw new AppError('User not found', 404);

  const wishlist = user.wishlist ?? [];
  const index = wishlist.findIndex((id) => String(id) === String(product._id));

  let message: string;
  if (index > -1) {
    wishlist.splice(index, 1);
    message = 'Removed from wishlist';
  } else {
    wishlist.push(product._id!);
    message = 'Added to wishlist';
  }
  user.wishlist = wishlist;
  await user.save();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message,
    data: { wishlist: user.wishlist },
  });
});

export const productControllers = {
  createProduct,
  getAllProducts,
  getFeaturedProducts,
  getProductSlugs,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleWishlist,
};
