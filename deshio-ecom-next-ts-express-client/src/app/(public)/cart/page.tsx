"use client";

import { useState } from "react";
import { CartItem, useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/utils/formatPrice";
import EditOptionModal from "@/components/cart/EditOptionModal";
import {
  ChevronRight,
  Lock,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Truck,
  SquarePen,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/context/ToastContext";

export default function CartPage() {
  const { user } = useAuth();
  const { items, totalItems, totalPrice, updateItem, removeItem, isSyncing } =
    useCart();
  const router = useRouter();
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);

  const handleProceed = () => {
    if (!user) {
      router.push("/login?redirect=/checkout");
    } else {
      router.push("/checkout");
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center">
          <ShoppingBag className="w-9 h-9 text-stone-400" />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            Your shopping bag is empty
          </h1>
          <p className="text-stone-500 text-sm mt-2 max-w-sm font-light">
            Looks like you haven&apos;t added any artisanal garments or contemporary silhouettes yet.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors shadow-sm"
        >
          <span>Explore Collections</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-stone-400">
          <Link href="/" className="hover:text-stone-700 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-stone-700">Shopping Bag</span>
        </nav>

        {/* Title */}
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            Shopping Bag
            <span className="ml-3 text-sm font-normal text-stone-500 font-sans">
              ({totalItems} {totalItems === 1 ? "garment" : "garments"})
            </span>
          </h1>
          {isSyncing && (
            <span className="text-xs text-stone-500 flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
              Syncing bag…
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Garments List */}
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item._id}
                className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-xs flex gap-5"
              >
                {/* Media (3:4 portrait) */}
                <Link href={`/products/${item.productId}`} className="shrink-0">
                  <div className="relative w-20 sm:w-24 aspect-[3/4] rounded-lg overflow-hidden bg-stone-100 border border-stone-200/80">
                    <Image
                      src={
                        item.image ||
                        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80"
                      }
                      alt={item.title}
                      fill
                      className="object-cover object-top"
                      sizes="96px"
                      unoptimized
                    />
                  </div>
                </Link>

                {/* Garment Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${item.productId}`}
                        className="font-medium text-sm sm:text-base text-stone-900 hover:text-amber-800 transition-colors line-clamp-2"
                      >
                        {item.title}
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          removeItem(item._id).catch(() =>
                            toast.error("Failed to remove item")
                          )
                        }
                        aria-label="Remove item"
                        className="text-stone-400 hover:text-rose-600 p-1 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Variant Summary + Edit Icon (matches reference image) */}
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-stone-500">
                      <span className="uppercase tracking-wide font-medium text-stone-500">
                        {[item.color, item.size].filter(Boolean).join(" / ") ||
                          "Standard Option"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingItem(item)}
                        aria-label="Edit option"
                        title="Edit size, color or quantity"
                        className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-900 p-1 rounded hover:bg-stone-100 transition-colors"
                      >
                        <SquarePen className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Price & Quantity Stepper */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-100">
                    <span className="font-bold text-stone-900 text-base sm:text-lg">
                      {formatPrice(item.price * item.quantity)}
                    </span>

                    <div className="inline-flex items-center border border-stone-300 rounded-lg bg-stone-50 overflow-hidden">
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
                        className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors"
                      >
                        {item.quantity <= 1 ? (
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        ) : (
                          <Minus className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="w-8 text-center text-xs font-semibold text-stone-900 select-none">
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
                        className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-200 disabled:opacity-40 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Sidebar */}
          <div className="bg-white border border-stone-200/80 rounded-xl p-6 space-y-5 shadow-xs sticky top-28">
            <h2 className="font-serif font-bold text-lg text-stone-900">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-stone-900">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery</span>
                <span className="text-xs text-stone-500 italic">
                  Calculated at checkout
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
              <span className="font-medium text-stone-900">Estimated Total</span>
              <span className="font-serif font-bold text-2xl text-stone-900">
                {formatPrice(totalPrice)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleProceed}
              className="w-full py-3.5 rounded-lg bg-stone-900 text-white font-semibold text-sm hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Lock className="w-4 h-4" />
              <span>Proceed to Checkout</span>
            </button>

            <div className="pt-4 border-t border-stone-100 space-y-2 text-xs text-stone-500">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-stone-700 shrink-0" />
                <span>Inside Dhaka (৳70) • Nationwide (৳130)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-stone-700 shrink-0" />
                <span>Cash on Delivery & Instant Mobile Banking</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Option Modal */}
      <EditOptionModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
      />
    </div>
  );
}
