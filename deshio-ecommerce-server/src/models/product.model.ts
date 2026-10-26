import { Schema, model } from 'mongoose';
import { IProduct } from '../types';
import { slugify } from '../utils/slugify';

const variantSchema = new Schema(
  {
    size: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    colorHex: { type: String, trim: true },
    sku: { type: String, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    priceOverride: { type: Number, min: 0 },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    price: { type: Number, required: true, min: 0 },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: String, trim: true },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    isFeatured: { type: Boolean, default: false },
    tags: [{ type: String, lowercase: true, trim: true }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    // Derived from variants when variants exist (see pre-validate hook)
    stock: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0 },
    // Fashion attributes
    gender: { type: String, enum: ['men', 'women', 'kids', 'unisex'], default: 'unisex' },
    material: { type: String, trim: true },
    fit: { type: String, trim: true },
    careInstructions: { type: String },
    sizeGuide: { type: String },
    variants: { type: [variantSchema], default: [] },
    specifications: { type: Map, of: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Auto slug (stable once set), variant SKUs and derived total stock
productSchema.pre('validate', async function () {
  if (!this.slug && this.title) {
    const base = slugify(this.title) || 'product';
    let candidate = base;
    let n = 1;
    const Model = this.constructor as any;
    // eslint-disable-next-line no-await-in-loop
    while (await Model.exists({ slug: candidate, _id: { $ne: this._id } })) {
      n += 1;
      candidate = `${base}-${n}`;
    }
    this.slug = candidate;
  }

  if (this.variants && this.variants.length > 0) {
    for (const v of this.variants) {
      if (!v.sku) {
        v.sku = `${this.slug ?? 'item'}-${v.size}-${v.color}`
          .toUpperCase()
          .replace(/[^\p{L}\p{N}]+/gu, '-');
      }
    }
    this.stock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }
});

// Indexes
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ isFeatured: 1, rating: -1 });
productSchema.index({ gender: 1, createdAt: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });

const Product = model<IProduct>('Product', productSchema);
export default Product;
