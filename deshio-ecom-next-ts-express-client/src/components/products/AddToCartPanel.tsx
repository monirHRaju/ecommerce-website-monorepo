"use client";

import { useState } from "react";
import {
  Heart,
  ShoppingBag,
  Check,
  Ruler,
  AlertCircle,
  Truck,
  ShieldCheck,
  RefreshCw,
  X,
} from "lucide-react";
import { Product, Variant } from "@/types";
import { discountedPrice, formatPrice } from "@/utils/formatPrice";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/context/ToastContext";
import api from "@/lib/axios";

interface AddToCartPanelProps {
  product: Product;
}

const DEFAULT_SIZE_GUIDE = [
  { size: "S", chest: '36–38"', waist: '30–32"', hips: '37–39"', length: '40"' },
  { size: "M", chest: '38–40"', waist: '32–34"', hips: '39–41"', length: '41"' },
  { size: "L", chest: '40–42"', waist: '34–36"', hips: '41–43"', length: '42"' },
  { size: "XL", chest: '42–44"', waist: '36–38"', hips: '43–45"', length: '43"' },
  { size: "XXL", chest: '44–46"', waist: '38–40"', hips: '45–47"', length: '44"' },
];

export default function AddToCartPanel({ product }: AddToCartPanelProps) {
  const { addItem, openCart } = useCart();
  const { user, updateUser } = useAuth();

  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;

  // Collect unique sizes and colors
  const availableSizes = hasVariants
    ? Array.from(new Set(variants.map((v) => v.size).filter(Boolean) as string[]))
    : [];

  const availableColors = hasVariants
    ? Array.from(new Set(variants.map((v) => v.color).filter(Boolean) as string[]))
    : [];

  // Default selections
  const [selectedSize, setSelectedSize] = useState<string>(
    availableSizes[0] || ""
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    availableColors[0] || ""
  );
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Wishlist state
  const [isWishlisted, setIsWishlisted] = useState(
    () => user?.wishlist?.includes(product._id) ?? false
  );
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Find active variant
  const activeVariant: Variant | undefined = hasVariants
    ? variants.find(
        (v) =>
          (!selectedSize || (v.size || "").toLowerCase() === selectedSize.toLowerCase()) &&
          (!selectedColor || (v.color || "").toLowerCase() === selectedColor.toLowerCase())
      ) || variants[0]
    : undefined;

  const currentStock = activeVariant ? activeVariant.stock : product.stock;
  const currentBasePrice = activeVariant?.priceOverride ?? product.price;
  const finalUnitPrice = discountedPrice(currentBasePrice, product.discount ?? 0);
  const isOutOfStock = currentStock === 0;

  const handleAddToCart = async () => {
    if (isOutOfStock || adding) return;
    setAdding(true);
    try {
      await addItem(product, qty, {
        size: selectedSize || activeVariant?.size,
        color: selectedColor || activeVariant?.color,
        sku: activeVariant?.sku,
        priceOverride: activeVariant?.priceOverride,
        stock: currentStock,
      });
      setAdded(true);
      openCart();
      setTimeout(() => setAdded(false), 2000);
    } catch {
      toast.error("Failed to add garment to bag");
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async () => {
    if (wishlistLoading) return;
    if (!user) {
      toast.error("Please sign in to save items to your wishlist");
      return;
    }
    setWishlistLoading(true);
    try {
      const res = await api.post(`/products/${product._id}/wishlist`);
      const isAdded = res.data.message?.toLowerCase().includes("added");
      setIsWishlisted(isAdded);
      updateUser({ ...user, wishlist: res.data.data.wishlist ?? [] });
      toast.success(isAdded ? "Saved to wishlist" : "Removed from wishlist");
    } catch {
      toast.error("Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="space-y-6 pt-4">
      {/* ── Price Block ─────────────────────────────────────────────── */}
      <div className="flex items-baseline gap-3">
        <span className="font-serif text-3xl font-bold text-stone-900">
          {formatPrice(finalUnitPrice)}
        </span>
        {product.discount > 0 && (
          <>
            <span className="text-base text-stone-400 line-through">
              {formatPrice(currentBasePrice)}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              Save {product.discount}%
            </span>
          </>
        )}
      </div>

      {/* ── Size Picker ─────────────────────────────────────────────── */}
      {availableSizes.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-stone-700">
              Select Size: <span className="text-stone-900">{selectedSize}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowSizeGuide(true)}
              className="inline-flex items-center gap-1 text-stone-600 hover:text-amber-800 transition-colors font-medium underline underline-offset-2"
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Size Guide</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {availableSizes.map((s) => {
              const isSelected = selectedSize === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSelectedSize(s);
                    setQty(1);
                  }}
                  className={`min-w-[48px] px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    isSelected
                      ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                      : "bg-white text-stone-800 border-stone-200 hover:border-stone-400"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Color Picker ────────────────────────────────────────────── */}
      {availableColors.length > 0 && (
        <div className="space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            Select Color: <span className="text-stone-900">{selectedColor}</span>
          </span>

          <div className="flex flex-wrap gap-2">
            {availableColors.map((c) => {
              const isSelected = selectedColor === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setSelectedColor(c);
                    setQty(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    isSelected
                      ? "border-stone-900 bg-stone-100 text-stone-900 font-semibold ring-1 ring-stone-900"
                      : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Real-Time Stock Status ──────────────────────────────────── */}
      <div className="text-xs">
        {isOutOfStock ? (
          <div className="inline-flex items-center gap-1.5 text-rose-600 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Out of stock in this selection</span>
          </div>
        ) : currentStock <= 5 ? (
          <div className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Only {currentStock} left in stock — order soon!</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>In Stock ({currentStock} available)</span>
          </div>
        )}
      </div>

      {/* ── Quantity & Add to Bag ───────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        {/* Quantity Stepper */}
        <div className="inline-flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1 || isOutOfStock}
            className="w-10 h-11 flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-40 transition-colors"
          >
            –
          </button>
          <span className="w-10 text-center text-sm font-semibold text-stone-900 select-none">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(currentStock, q + 1))}
            disabled={qty >= currentStock || isOutOfStock}
            className="w-10 h-11 flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-40 transition-colors"
          >
            +
          </button>
        </div>

        {/* Add to Bag Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock || adding}
          className={`flex-1 h-11 rounded-lg font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all shadow-sm ${
            added
              ? "bg-emerald-700 text-white"
              : isOutOfStock
              ? "bg-stone-200 text-stone-400 cursor-not-allowed"
              : "bg-stone-900 text-white hover:bg-stone-800"
          }`}
        >
          {adding ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : added ? (
            <>
              <Check className="w-4 h-4" />
              <span>Added to Bag!</span>
            </>
          ) : isOutOfStock ? (
            <span>Sold Out</span>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Bag — {formatPrice(finalUnitPrice * qty)}</span>
            </>
          )}
        </button>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlist}
          disabled={wishlistLoading}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`w-11 h-11 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
            isWishlisted
              ? "bg-rose-50 border-rose-300 text-rose-600"
              : "bg-white border-stone-300 text-stone-700 hover:bg-stone-50 hover:text-rose-600"
          }`}
        >
          <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* ── Assurance Strip ─────────────────────────────────────────── */}
      <div className="pt-6 border-t border-stone-200/80 space-y-3">
        <div className="flex items-center gap-3 text-xs text-stone-600">
          <Truck className="w-4 h-4 text-stone-700 shrink-0" />
          <span>Inside Dhaka in 24–48h (৳70) • Nationwide in 3–5 days (৳130)</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-stone-600">
          <RefreshCw className="w-4 h-4 text-stone-700 shrink-0" />
          <span>7-day doorstep exchange for size and fit</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-stone-600">
          <ShieldCheck className="w-4 h-4 text-stone-700 shrink-0" />
          <span>100% genuine artisanal fabric with quality inspection</span>
        </div>
      </div>

      {/* ── Size Guide Modal ─────────────────────────────────────────── */}
      {showSizeGuide && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowSizeGuide(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Size & Fit Guide
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  All measurements are in inches.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeGuide(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100 text-stone-800 font-semibold">
                    <th className="p-2.5 rounded-l-md">Size</th>
                    <th className="p-2.5">Chest</th>
                    <th className="p-2.5">Waist</th>
                    <th className="p-2.5">Hips</th>
                    <th className="p-2.5 rounded-r-md">Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-600">
                  {DEFAULT_SIZE_GUIDE.map((row) => (
                    <tr
                      key={row.size}
                      className={
                        selectedSize === row.size
                          ? "bg-amber-50/60 font-semibold text-stone-900"
                          : ""
                      }
                    >
                      <td className="p-2.5 font-bold text-stone-900">{row.size}</td>
                      <td className="p-2.5">{row.chest}</td>
                      <td className="p-2.5">{row.waist}</td>
                      <td className="p-2.5">{row.hips}</td>
                      <td className="p-2.5">{row.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-stone-50 rounded-lg text-xs text-stone-600 leading-relaxed">
              <span className="font-semibold text-stone-900">Styling Note:</span>{" "}
              Traditional panjabis and ethnic kurtis feature a classic relaxed drape. If you prefer a tailored, slim silhouette, consider sizing down.
            </div>

            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => setShowSizeGuide(false)}
                className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
