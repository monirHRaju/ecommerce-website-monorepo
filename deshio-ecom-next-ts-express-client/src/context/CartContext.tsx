"use client";

import api from "@/lib/axios";
import { Product } from "@/types";
import { discountedPrice } from "@/utils/formatPrice";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  _id: string;       // subdoc _id (auth) or compound key (guest)
  productId: string;
  title: string;
  image: string;
  price: number;     // final price after discount or override
  stock: number;
  quantity: number;
  brand?: string;
  size?: string;
  color?: string;
  sku?: string;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  isSyncing: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, qty?: number, variant?: { size?: string; color?: string; sku?: string; priceOverride?: number; stock?: number }) => Promise<void>;
  updateItem: (itemId: string, qty: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const GUEST_KEY = "guestCart";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readGuestCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeGuestCart(items: CartItem[]) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(items));
}

function normalizeAuthItems(raw: any[]): CartItem[] {
  return raw
    .filter((i) => i.productId) // skip orphan items
    .map((i) => {
      const p = i.productId as any;
      return {
        _id: i._id,
        productId: p._id ?? p,
        title: p.title ?? "",
        image: p.images?.[0] ?? "",
        price: i.price ?? discountedPrice(p.price ?? 0, p.discount ?? 0),
        stock: i.variantStock ?? p.stock ?? 99,
        brand: p.brand,
        size: i.size,
        color: i.color,
        sku: i.sku,
        quantity: i.quantity,
      };
    });
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const prevUserId = useRef<string | null>(null);

  // Computed values
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  // ── Load cart on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    if (user) {
      fetchAuthCart();
    } else {
      setItems(readGuestCart());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Detect login → sync guest cart to API ──────────────────────────────────
  useEffect(() => {
    const prev = prevUserId.current;
    const curr = user?._id ?? null;

    if (!prev && curr) {
      // Just logged in — sync guest cart
      syncGuestToApi();
    } else if (prev && !curr) {
      // Just logged out — switch to guest cart
      setItems(readGuestCart());
    }

    prevUserId.current = curr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  // ── Fetch auth cart ─────────────────────────────────────────────────────────
  const fetchAuthCart = useCallback(async () => {
    try {
      const res = await api.get("/cart");
      setItems(normalizeAuthItems(res.data.data?.items ?? []));
    } catch {
      setItems([]);
    }
  }, []);

  // ── Sync guest → API on login ───────────────────────────────────────────────
  const syncGuestToApi = useCallback(async () => {
    const guest = readGuestCart();
    if (guest.length > 0) {
      setIsSyncing(true);
      try {
        await Promise.all(
          guest.map((item) =>
            api.post("/cart", {
              productId: item.productId,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              sku: item.sku,
            })
          )
        );
        localStorage.removeItem(GUEST_KEY);
      } catch {
        // best-effort
      } finally {
        setIsSyncing(false);
      }
    } else {
      localStorage.removeItem(GUEST_KEY);
    }
    await fetchAuthCart();
  }, [fetchAuthCart]);

  // ── Add item ────────────────────────────────────────────────────────────────
  const addItem = useCallback(
    async (
      product: Product,
      qty = 1,
      variant?: { size?: string; color?: string; sku?: string; priceOverride?: number; stock?: number }
    ) => {
      const basePrice = variant?.priceOverride ?? product.price;
      const finalPrice = discountedPrice(basePrice, product.discount ?? 0);
      const effectiveStock = variant?.stock ?? product.stock;

      if (user) {
        await api.post("/cart", {
          productId: product._id,
          quantity: qty,
          size: variant?.size,
          color: variant?.color,
          sku: variant?.sku,
        });
        await fetchAuthCart();
      } else {
        setItems((prev) => {
          const itemKey = `${product._id}-${variant?.size || ""}-${variant?.color || ""}`;
          const existing = prev.find(
            (i) =>
              i.productId === product._id &&
              (i.size || "") === (variant?.size || "") &&
              (i.color || "") === (variant?.color || "")
          );
          let next: CartItem[];
          if (existing) {
            next = prev.map((i) =>
              i._id === existing._id
                ? { ...i, quantity: Math.min(i.quantity + qty, effectiveStock) }
                : i
            );
          } else {
            next = [
              ...prev,
              {
                _id: itemKey,
                productId: product._id,
                title: product.title,
                image: product.images?.[0] ?? "",
                price: finalPrice,
                stock: effectiveStock,
                brand: product.brand,
                size: variant?.size,
                color: variant?.color,
                sku: variant?.sku,
                quantity: qty,
              },
            ];
          }
          writeGuestCart(next);
          return next;
        });
      }
    },
    [user, fetchAuthCart]
  );

  // ── Update qty ──────────────────────────────────────────────────────────────
  const updateItem = useCallback(
    async (itemId: string, qty: number) => {
      if (user) {
        await api.patch(`/cart/${itemId}`, { quantity: qty });
        await fetchAuthCart();
      } else {
        setItems((prev) => {
          const next = prev.map((i) =>
            i._id === itemId ? { ...i, quantity: qty } : i
          );
          writeGuestCart(next);
          return next;
        });
      }
    },
    [user, fetchAuthCart]
  );

  // ── Remove item ─────────────────────────────────────────────────────────────
  const removeItem = useCallback(
    async (itemId: string) => {
      if (user) {
        await api.delete(`/cart/${itemId}`);
        await fetchAuthCart();
      } else {
        setItems((prev) => {
          const next = prev.filter((i) => i._id !== itemId);
          writeGuestCart(next);
          return next;
        });
      }
    },
    [user, fetchAuthCart]
  );

  // ── Clear cart ──────────────────────────────────────────────────────────────
  const clearCart = useCallback(() => {
    setItems([]);
    if (!user) localStorage.removeItem(GUEST_KEY);
  }, [user]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        isOpen,
        isSyncing,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        updateItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
