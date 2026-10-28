"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "@/context/ToastContext";
import { Product } from "@/types";
import { discountedPrice, formatPrice } from "@/utils/formatPrice";
import { isProductOutOfStock, pickDefaultVariant } from "@/utils/variants";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { user, updateUser } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(
    () => user?.wishlist?.includes(product._id) ?? false
  );
  const [adding, setAdding] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const defaultVariant = pickDefaultVariant(product);
  const basePrice = defaultVariant?.priceOverride ?? product.price;
  const finalPrice = discountedPrice(basePrice, product.discount);
  const productUrl = `/products/${product.slug || product._id}`;
  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const isOutOfStock = isProductOutOfStock(product);

  // Extract unique sizes if variants exist
  const availableSizes = hasVariants
    ? Array.from(new Set(product.variants!.map((v) => v.size).filter(Boolean)))
    : [];

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (adding || isOutOfStock) return;
    setAdding(true);
    try {
      await addItem(
        product,
        1,
        defaultVariant
          ? {
              size: defaultVariant.size,
              color: defaultVariant.color,
              sku: defaultVariant.sku,
              priceOverride: defaultVariant.priceOverride,
              stock: defaultVariant.stock,
            }
          : undefined
      );
      router.push("/checkout");
    } catch {
      toast.error("Failed to add to bag");
      setAdding(false);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (wishlistLoading) return;
    if (!user) {
      toast.error("Please sign in to save items to your wishlist");
      return;
    }
    setWishlistLoading(true);
    try {
      const res = await api.post(`/products/${product._id}/wishlist`);
      const added = res.data.message?.toLowerCase().includes("added");
      setIsWishlisted(added);
      updateUser({ ...user, wishlist: res.data.data.wishlist ?? [] });
      toast.success(added ? "Saved to wishlist" : "Removed from wishlist");
    } catch {
      toast.error("Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="group relative flex flex-col h-full bg-white rounded-xl border border-stone-200/80 overflow-hidden hover:shadow-lg hover:border-stone-300 transition-all duration-300">
      {/* ── Visual Media Container (Portrait 3:4) ─────────────────────── */}
      <Link href={productUrl} className="relative block aspect-[3/4] w-full bg-stone-100 overflow-hidden">
        {/* Primary Image */}
        <Image
          src={product.images?.[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80"}
          alt={product.title}
          fill
          className={`object-cover object-top transition-transform duration-500 group-hover:scale-105 ${
            product.images?.[1] ? "group-hover:opacity-0 transition-opacity duration-500" : ""
          }`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          unoptimized
        />

        {/* Alternate Image on Hover */}
        {product.images?.[1] && (
          <Image
            src={product.images[1]}
            alt={`${product.title} alternate angle`}
            fill
            className="object-cover object-top opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized
          />
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.discount > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-600 text-white shadow-xs">
              -{product.discount}%
            </span>
          )}
          {product.isFeatured && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase bg-stone-900/80 text-white backdrop-blur-xs">
              Featured
            </span>
          )}
        </div>

        {/* Gender Badge */}
        {product.gender && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase bg-white/90 text-stone-800 shadow-xs backdrop-blur-xs">
              {product.gender}
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          disabled={wishlistLoading}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute bottom-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
            isWishlisted
              ? "bg-rose-50 text-rose-600 border border-rose-200"
              : "bg-white/90 text-stone-700 hover:text-rose-600 hover:bg-white border border-stone-200"
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
        </button>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-20">
            <span className="px-3 py-1 rounded-md bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* ── Product Information ───────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-4">
        {/* Category / Brand */}
        <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
          <span className="uppercase tracking-wider font-medium text-[11px]">
            {typeof product.category === "object" && product.category?.name
              ? product.category.name
              : product.brand || "Signature Collection"}
          </span>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1 text-stone-600">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <Link href={productUrl} className="block group-hover:text-amber-800 transition-colors">
          <h3 className="font-medium text-sm text-stone-900 leading-snug line-clamp-2 min-h-[2.5rem]">
            {product.title}
          </h3>
        </Link>

        {/* Available Sizes preview */}
        {availableSizes.length > 0 && (
          <div className="flex items-center gap-1 mt-2 text-[11px] text-stone-500">
            <span className="font-medium text-stone-400">Sizes:</span>
            <span className="text-stone-700 font-medium">
              {availableSizes.slice(0, 4).join(", ")}
              {availableSizes.length > 4 ? " +" : ""}
            </span>
          </div>
        )}

        {/* Price & Action */}
        <div className="mt-auto pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-stone-900">
                {formatPrice(finalPrice)}
              </span>
              {product.discount > 0 && (
                <span className="text-xs text-stone-400 line-through">
                  {formatPrice(basePrice)}
                </span>
              )}
            </div>
          </div>

          {/* Quick Add to Cart → Instant Checkout */}
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isOutOfStock || adding}
            aria-label="Add to Cart"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {adding ? (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <ShoppingBag className="w-3.5 h-3.5" />
            )}
            <span>{adding ? "Adding…" : "Add to Cart"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
