import { Product, Variant } from "@/types";

/**
 * Picks the default variant for quick-add:
 * 1. First variant with stock > 0
 * 2. Fallback to the first variant if all are out of stock
 * 3. undefined if the product has no variants
 */
export function pickDefaultVariant(product: Product): Variant | undefined {
  const variants = product.variants ?? [];
  if (variants.length === 0) return undefined;
  return variants.find((v) => v.stock > 0) ?? variants[0];
}

/**
 * Checks whether a product is completely out of stock
 * (either product.stock === 0 or all variants have stock <= 0).
 */
export function isProductOutOfStock(product: Product): boolean {
  const variants = product.variants ?? [];
  if (variants.length > 0) {
    return variants.every((v) => v.stock <= 0) || product.stock === 0;
  }
  return product.stock === 0;
}
