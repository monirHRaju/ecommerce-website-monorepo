"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/formatPrice";
import { Minus, Plus, ShoppingBag, Trash2, X, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/context/ToastContext";

export default function CartSidebar() {
  const { user } = useAuth();
  const {
    items,
    totalItems,
    totalPrice,
    isOpen,
    closeCart,
    updateItem,
    removeItem,
  } = useCart();
  const router = useRouter();

  const handleProceed = () => {
    closeCart();
    if (!user) {
      router.push("/login?redirect=/checkout");
    } else {
      router.push("/checkout");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className={cn(
          "fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out border-l border-stone-200",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-amber-800" />
            <h2 className="font-serif font-bold text-base text-stone-900">
              Shopping Bag
              {totalItems > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-800 border border-stone-200">
                  {totalItems}
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-stone-400" />
              </div>
              <div>
                <p className="font-serif font-semibold text-lg text-stone-900">
                  Your bag is empty
                </p>
                <p className="text-xs text-stone-500 mt-1 max-w-xs font-light">
                  Explore our newest artisanal weaves and seasonal silhouettes.
                </p>
              </div>
              <Link
                href="/products"
                onClick={closeCart}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                <span>Explore Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100 px-5 py-2">
              {items.map((item) => (
                <li key={item._id} className="py-4 flex gap-3.5">
                  {/* Portrait Media Thumbnail (3:4) */}
                  <Link
                    href={`/products/${item.productId}`}
                    onClick={closeCart}
                    className="shrink-0"
                  >
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-stone-100 border border-stone-200/80">
                      <Image
                        src={
                          item.image ||
                          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&q=80"
                        }
                        alt={item.title}
                        fill
                        className="object-cover object-top"
                        sizes="64px"
                        unoptimized
                      />
                    </div>
                  </Link>

                  {/* Garment Information */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <Link
                      href={`/products/${item.productId}`}
                      onClick={closeCart}
                      className="text-xs sm:text-sm font-medium text-stone-900 line-clamp-2 hover:text-amber-800 transition-colors"
                    >
                      {item.title}
                    </Link>

                    {/* Variant Attributes (Size & Color) */}
                    {(item.size || item.color) && (
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                        {item.size && (
                          <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
                            Size: {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
                            {item.color}
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-xs sm:text-sm font-bold text-stone-900 pt-0.5">
                      {formatPrice(item.price)}
                    </p>

                    {/* Quantity Stepper & Remove */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="inline-flex items-center border border-stone-200 rounded-md bg-stone-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity <= 1) {
                              removeItem(item._id).catch(() =>
                                toast.error("Failed to remove item")
                              );
                            } else {
                              updateItem(item._id, item.quantity - 1).catch(() =>
                                toast.error("Failed to update quantity")
                              );
                            }
                          }}
                          aria-label="Decrease quantity"
                          className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors"
                        >
                          {item.quantity <= 1 ? (
                            <Trash2 className="w-3 h-3 text-rose-600" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                        </button>
                        <span className="w-7 text-center text-xs font-semibold text-stone-900 select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity >= item.stock) {
                              toast.error("Not enough units in stock");
                              return;
                            }
                            updateItem(item._id, item.quantity + 1).catch(() =>
                              toast.error("Failed to update quantity")
                            );
                          }}
                          disabled={item.quantity >= item.stock}
                          aria-label="Increase quantity"
                          className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-200 disabled:opacity-40 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeItem(item._id).catch(() =>
                            toast.error("Failed to remove item")
                          )
                        }
                        aria-label="Delete item"
                        className="text-stone-400 hover:text-rose-600 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer with Summary & Checkout CTA */}
        {items.length > 0 && (
          <div className="border-t border-stone-200 p-5 space-y-3 bg-stone-50/60">
            <div className="flex justify-between items-baseline text-sm">
              <span className="text-stone-500 font-light">Subtotal</span>
              <span className="font-serif font-bold text-lg text-stone-900">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Delivery options & coupon discounts calculated during checkout.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Link
                href="/cart"
                onClick={closeCart}
                className="py-2.5 rounded-lg border border-stone-300 bg-white text-stone-800 text-xs font-semibold text-center hover:bg-stone-100 transition-colors"
              >
                View Full Bag
              </Link>
              <button
                type="button"
                onClick={handleProceed}
                className="py-2.5 rounded-lg bg-stone-900 text-white text-xs font-semibold text-center hover:bg-stone-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
