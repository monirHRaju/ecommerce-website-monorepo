"use client";

import { useEffect, useRef } from "react";
import { Product } from "@/types";
import { discountedPrice } from "@/utils/formatPrice";
import { pickDefaultVariant } from "@/utils/variants";
import { trackEvent } from "@/lib/analytics";

interface ProductListTrackerProps {
  products: Product[];
  listId?: string;
  listName?: string;
}

export default function ProductListTracker({
  products,
  listId = "catalog",
  listName = "Product Catalog",
}: ProductListTrackerProps) {
  const lastSignatureRef = useRef<string>("");

  useEffect(() => {
    if (!products || products.length === 0) return;

    const signature = `${listId}:${products
      .slice(0, 12)
      .map((p) => p._id)
      .join(",")}`;
    if (lastSignatureRef.current === signature) return;
    lastSignatureRef.current = signature;

    const contents = products.slice(0, 20).map((p, index) => {
      const defaultVariant = pickDefaultVariant(p);
      const basePrice = defaultVariant?.priceOverride ?? p.price;
      const finalPrice = discountedPrice(basePrice, p.discount ?? 0);
      const discountAmt = Math.max(0, basePrice - finalPrice);
      const categoryName =
        typeof p.category === "object" ? p.category?.name : undefined;
      const variantLabel = [defaultVariant?.size, defaultVariant?.color]
        .filter(Boolean)
        .join(" / ");

      return {
        id: defaultVariant?.sku || p._id,
        item_name: p.title,
        item_brand: p.brand || "Deshio",
        item_category: categoryName,
        item_variant: variantLabel || undefined,
        quantity: 1,
        item_price: finalPrice,
        discount: discountAmt > 0 ? discountAmt : undefined,
        index,
      };
    });

    const totalValue = contents.reduce((sum, c) => sum + (c.item_price || 0), 0);

    trackEvent("ViewItemList", {
      skipServerForward: true,
      customData: {
        item_list_id: listId,
        item_list_name: listName,
        currency: "BDT",
        value: totalValue,
        content_ids: contents.map((c) => c.id),
        content_type: "product",
        contents,
        num_items: contents.length,
      },
    });
  }, [products, listId, listName]);

  return null;
}
