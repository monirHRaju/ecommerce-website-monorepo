import { Schema, model } from 'mongoose';
import { ICart } from '../types';

const cartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    size: { type: String, trim: true },
    color: { type: String, trim: true },
    sku: { type: String, trim: true },
  },
  { _id: true }
);

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
    totalAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Cart = model<ICart>('Cart', cartSchema);
export default Cart;
