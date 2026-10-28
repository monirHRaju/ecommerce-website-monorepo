"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, X, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { CartItem, useCart } from "@/context/CartContext";
import { Product, Variant } from "@/types";
import { discountedPrice, formatPrice } from "@/utils/formatPrice";
import { toast } from "@/context/ToastContext";

interface EditOptionModalProps {
  item: CartItem | null;
  onClose: () => void;
}

interface ExtraVariantRow {
  id: string;
  size: string;
  color: string;
  quantity: number;
}

const COLOR_HEX_MAP: Record<string, string> = {
  black: "#18181b",
  white: "#ffffff",
  navy: "#1e3a8a",
  maroon: "#881337",
  olive: "#3f6212",
  "agave green": "#5f6f52",
  green: "#15803d",
  beige: "#d6d3d1",
  blue: "#0284c7",
  gold: "#ca8a04",
  peach: "#f5cba7",
  pink: "#f472b6",
  red: "#dc2626",
  yellow: "#eab308",
  orange: "#ea580c",
  purple: "#7e22ce",
  lavender: "#c4b5fd",
  brown: "#78350f",
  grey: "#6b7280",
  gray: "#6b7280",
  charcoal: "#374151",
  cream: "#fef3c7",
  ivory: "#fffff0",
  teal: "#0d9488",
  sky: "#38bdf8",
};

function getColorSwatchHex(colorName: string): string {
  const key = colorName.trim().toLowerCase();
  if (COLOR_HEX_MAP[key]) return COLOR_HEX_MAP[key];
  // Check partial match
  for (const [k, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (key.includes(k)) return hex;
  }
  return "#e7e5e4"; // stone-200 fallback
}

function findMatchingVariant(
  variants: Variant[],
  size: string,
  color: string
): Variant | undefined {
  if (variants.length === 0) return undefined;
  return (
    variants.find(
      (v) =>
        (!size || (v.size || "").toLowerCase() === size.toLowerCase()) &&
        (!color || (v.color || "").toLowerCase() === color.toLowerCase())
    ) || variants[0]
  );
}

export default function EditOptionModal({ item, onClose }: EditOptionModalProps) {
  const { updateItemOptions, addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [extraRows, setExtraRows] = useState<ExtraVariantRow[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["product-detail-modal", item?.productId],
    queryFn: async () => {
      const res = await api.get(`/products/${item!.productId}`);
      return res.data.data;
    },
    enabled: Boolean(item?.productId),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (item) {
      setSelectedSize(item.size || "");
      setSelectedColor(item.color || "");
      setQuantity(item.quantity);
      setExtraRows([]);
    }
  }, [item]);

  // Populate default size/color from product variants if item lacked them
  useEffect(() => {
    if (!product || !item) return;
    const variants = product.variants ?? [];
    if (variants.length > 0) {
      if (!selectedSize && variants[0].size) {
        setSelectedSize(item.size || variants[0].size);
      }
      if (!selectedColor && variants[0].color) {
        setSelectedColor(item.color || variants[0].color);
      }
    }
  }, [product, item, selectedSize, selectedColor]);

  if (!item) return null;

  const variants = product?.variants ?? [];
  const hasVariants = variants.length > 0;

  const availableSizes = hasVariants
    ? Array.from(new Set(variants.map((v) => v.size).filter(Boolean) as string[]))
    : [];
  const availableColors = hasVariants
    ? Array.from(new Set(variants.map((v) => v.color).filter(Boolean) as string[]))
    : [];

  const activeVariant = findMatchingVariant(variants, selectedSize, selectedColor);
  const maxStock = activeVariant
    ? activeVariant.stock
    : product?.stock ?? item.stock ?? 99;
  const unitPrice = product
    ? discountedPrice(
        activeVariant?.priceOverride ?? product.price,
        product.discount ?? 0
      )
    : item.price;

  // Check if a specific size has stock for the currently selected color
  const isSizeAvailable = (sz: string, colorToMatch: string) => {
    if (!hasVariants) return true;
    const match = variants.find(
      (v) =>
        (v.size || "").toLowerCase() === sz.toLowerCase() &&
        (!colorToMatch ||
          (v.color || "").toLowerCase() === colorToMatch.toLowerCase())
    );
    return match ? match.stock > 0 : true;
  };

  const handleAddMoreRow = () => {
    const defaultVar =
      variants.find((v) => v.stock > 0) ?? variants[0];
    setExtraRows((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        size: defaultVar?.size || availableSizes[0] || "",
        color: defaultVar?.color || availableColors[0] || "",
        quantity: 1,
      },
    ]);
  };

  const handleRemoveExtraRow = (id: string) => {
    setExtraRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSave = async () => {
    if (saving) return;
    if (maxStock <= 0) {
      toast.error("Selected option is out of stock");
      return;
    }
    setSaving(true);
    try {
      await updateItemOptions(item._id, {
        quantity: Math.min(quantity, maxStock),
        size: selectedSize || undefined,
        color: selectedColor || undefined,
        sku: activeVariant?.sku,
        price: unitPrice,
        stock: maxStock,
      });

      // If customer added extra variant rows via "+ ADD MORE", add them too
      if (product && extraRows.length > 0) {
        for (const row of extraRows) {
          const rowVariant = findMatchingVariant(variants, row.size, row.color);
          const rowStock = rowVariant ? rowVariant.stock : product.stock;
          if (rowStock > 0) {
            await addItem(product, Math.min(row.quantity, rowStock), {
              size: row.size || undefined,
              color: row.color || undefined,
              sku: rowVariant?.sku,
              priceOverride: rowVariant?.priceOverride,
              stock: rowStock,
            });
          }
        }
      }

      toast.success("Cart item updated");
      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to update cart option"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Close Button (matches reference black square X) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-0 right-0 z-10 w-9 h-9 bg-stone-900 text-white hover:bg-stone-700 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 max-h-[82vh] overflow-y-auto space-y-6">
          <h2 className="text-lg font-bold text-stone-900">Edit Option</h2>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs">Loading available options…</span>
            </div>
          ) : (
            <>
              {/* Primary Item Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                {/* Left Column: Image + Title + Current Variant + Price + Quantity */}
                <div className="flex gap-4">
                  <div className="relative w-24 h-32 sm:w-28 sm:h-36 bg-stone-100 border border-stone-200/80 shrink-0 overflow-hidden">
                    <Image
                      src={
                        item.image ||
                        product?.images?.[0] ||
                        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80"
                      }
                      alt={item.title}
                      fill
                      className="object-cover object-top"
                      sizes="112px"
                      unoptimized
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <h3 className="text-xs sm:text-sm font-normal text-stone-800 leading-relaxed">
                      {item.title}
                    </h3>

                    {(selectedColor || selectedSize) && (
                      <p className="text-xs text-stone-400 uppercase tracking-wide">
                        {[selectedColor, selectedSize].filter(Boolean).join(" / ")}
                      </p>
                    )}

                    <p className="text-sm font-bold text-stone-900">
                      {formatPrice(unitPrice)}
                    </p>

                    <div className="pt-1 space-y-1.5">
                      <span className="block text-xs text-stone-500">
                        Quantity:
                      </span>
                      <div className="inline-flex items-center border border-stone-300 bg-white">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={quantity <= 1}
                          className="w-9 h-9 flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-40 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-9 text-center text-xs font-semibold text-stone-900 select-none">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity((q) => Math.min(maxStock, q + 1))
                          }
                          disabled={quantity >= maxStock}
                          className="w-9 h-9 flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-40 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Color & Size Selectors */}
                <div className="space-y-5">
                  {/* Color Selector */}
                  {availableColors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-stone-800">
                        Color:{" "}
                        <span className="font-normal text-stone-500 uppercase">
                          {selectedColor}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2.5">
                        {availableColors.map((color) => {
                          const isSelected =
                            selectedColor.toLowerCase() === color.toLowerCase();
                          const swatchHex = getColorSwatchHex(color);
                          return (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setSelectedColor(color)}
                              title={color}
                              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                                isSelected
                                  ? "border-stone-900 ring-1 ring-stone-900 p-0.5"
                                  : "border-stone-300 hover:border-stone-500 p-0.5"
                              }`}
                            >
                              <span
                                className="w-full h-full rounded-full border border-stone-200"
                                style={{ backgroundColor: swatchHex }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Size Selector */}
                  {availableSizes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-stone-800">
                        Size:{" "}
                        <span className="font-normal text-stone-500 uppercase">
                          {selectedSize}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {availableSizes.map((sz) => {
                          const isSelected =
                            selectedSize.toLowerCase() === sz.toLowerCase();
                          const inStock = isSizeAvailable(sz, selectedColor);
                          return (
                            <button
                              key={sz}
                              type="button"
                              disabled={!inStock}
                              onClick={() => setSelectedSize(sz)}
                              className={`min-w-[42px] h-10 px-3 text-xs font-medium border transition-colors ${
                                isSelected
                                  ? "border-stone-900 text-stone-900 font-bold bg-white shadow-2xs"
                                  : inStock
                                  ? "border-stone-200 text-stone-600 hover:border-stone-400 bg-white"
                                  : "border-stone-100 text-stone-300 bg-stone-50 line-through cursor-not-allowed"
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!hasVariants && (
                    <p className="text-xs text-stone-500">
                      This item comes in a single standard option. You can adjust
                      the quantity on the left.
                    </p>
                  )}
                </div>
              </div>

              {/* Extra Variant Rows added via "+ ADD MORE" */}
              {extraRows.map((row) => {
                const rowVar = findMatchingVariant(
                  variants,
                  row.size,
                  row.color
                );
                const rowMax = rowVar ? rowVar.stock : product?.stock ?? 99;
                const rowPrice = product
                  ? discountedPrice(
                      rowVar?.priceOverride ?? product.price,
                      product.discount ?? 0
                    )
                  : item.price;

                return (
                  <div
                    key={row.id}
                    className="pt-5 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start relative"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveExtraRow(row.id)}
                      className="absolute top-3 right-0 text-stone-400 hover:text-rose-600 p-1"
                      aria-label="Remove additional option"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-stone-700">
                        Additional Option:{" "}
                        <span className="uppercase text-stone-500">
                          {[row.color, row.size].filter(Boolean).join(" / ")}
                        </span>
                      </p>
                      <p className="text-sm font-bold text-stone-900">
                        {formatPrice(rowPrice)}
                      </p>
                      <div className="inline-flex items-center border border-stone-300 bg-white">
                        <button
                          type="button"
                          onClick={() =>
                            setExtraRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id
                                  ? { ...r, quantity: Math.max(1, r.quantity - 1) }
                                  : r
                              )
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-stone-900">
                          {row.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setExtraRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id
                                  ? {
                                      ...r,
                                      quantity: Math.min(rowMax, r.quantity + 1),
                                    }
                                  : r
                              )
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {availableColors.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {availableColors.map((color) => {
                            const isSelected =
                              row.color.toLowerCase() === color.toLowerCase();
                            return (
                              <button
                                key={color}
                                type="button"
                                onClick={() =>
                                  setExtraRows((prev) =>
                                    prev.map((r) =>
                                      r.id === row.id ? { ...r, color } : r
                                    )
                                  )
                                }
                                title={color}
                                className={`w-7 h-7 rounded-full border p-0.5 ${
                                  isSelected
                                    ? "border-stone-900 ring-1 ring-stone-900"
                                    : "border-stone-300"
                                }`}
                              >
                                <span
                                  className="block w-full h-full rounded-full border border-stone-200"
                                  style={{
                                    backgroundColor: getColorSwatchHex(color),
                                  }}
                                />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {availableSizes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {availableSizes.map((sz) => {
                            const isSelected =
                              row.size.toLowerCase() === sz.toLowerCase();
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() =>
                                  setExtraRows((prev) =>
                                    prev.map((r) =>
                                      r.id === row.id ? { ...r, size: sz } : r
                                    )
                                  )
                                }
                                className={`min-w-[36px] h-8 px-2 text-xs border ${
                                  isSelected
                                    ? "border-stone-900 font-bold text-stone-900"
                                    : "border-stone-200 text-stone-600"
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* + ADD MORE divider & action */}
              {hasVariants && (
                <div className="pt-4 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={handleAddMoreRow}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-800 hover:text-amber-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="underline underline-offset-4">ADD MORE</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Full-Width Bottom Action Bar */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || isLoading}
          className="w-full py-4 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{saving ? "UPDATING…" : "ADD TO CART"}</span>
        </button>
      </div>
    </div>
  );
}
