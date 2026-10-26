"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Heart,
  Package,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import api from "@/lib/axios";
import { formatPrice } from "@/utils/formatPrice";

// ── Search Island ────────────────────────────────────────────────────────────

interface SearchProduct {
  _id: string;
  slug?: string;
  title: string;
  price: number;
  discount: number;
  images: string[];
}

export function SearchIsland() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products?search=${encodeURIComponent(query)}&limit=5`);
        setResults(res.data.data ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const searchModalContent = isOpen ? (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 animate-in fade-in duration-200">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-10">
        <form onSubmit={handleSubmit} className="flex items-center px-4 py-3 border-b border-stone-200 gap-3">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product, fabric, color or style…"
            className="flex-1 text-sm bg-transparent outline-none text-stone-900 placeholder:text-stone-400"
          />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-stone-400 hover:text-stone-600"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        {loading && (
          <div className="p-4 text-center text-xs text-stone-400 animate-pulse">
            Searching fashion catalogue…
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 p-2">
            {results.map((product) => {
              const finalPrice = product.discount > 0
                ? product.price * (1 - product.discount / 100)
                : product.price;
              const href = product.slug ? `/products/${product.slug}` : `/products/${product._id}`;

              return (
                <Link
                  key={product._id}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 transition-colors"
                >
                  {product.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-12 h-14 object-cover rounded-lg bg-stone-100 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-14 bg-stone-100 rounded-lg shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {product.title}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {formatPrice(finalPrice)}
                      {product.discount > 0 && (
                        <span className="line-through ml-1.5 text-[11px] text-stone-400">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <div className="p-8 text-center text-sm text-stone-400">
            No products found matching &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-stone-700 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
        aria-label="Search collection"
      >
        <Search className="w-5 h-5" />
      </button>

      {mounted && searchModalContent ? createPortal(searchModalContent, document.body) : null}
    </>
  );
}

// ── Cart Trigger Island ──────────────────────────────────────────────────────

export function CartTriggerIsland() {
  const { totalItems, openCart } = useCart();

  return (
    <button
      onClick={openCart}
      className="relative p-2 text-stone-700 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
      aria-label="Shopping bag"
    >
      <ShoppingCart className="w-5 h-5" />
      {totalItems > 0 && (
        <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-stone-900 text-[10px] font-bold text-white leading-none">
          {totalItems}
        </span>
      )}
    </button>
  );
}

// ── User Account Island ──────────────────────────────────────────────────────

export function UserAccountIsland() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-xs font-semibold uppercase tracking-wider px-3.5 py-2 rounded-lg text-stone-800 hover:bg-stone-100 transition-colors"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-1.5 p-1.5 rounded-lg text-stone-800 hover:bg-stone-100 transition-colors"
        aria-label="User account"
      >
        <div className="w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-medium uppercase">
          {user.name?.charAt(0) || "U"}
        </div>
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-xl border border-stone-200 py-1.5 z-50 text-sm animate-in fade-in slide-in-from-top-1">
          <div className="px-3.5 py-2 border-b border-stone-100">
            <p className="font-semibold text-stone-900 truncate">{user.name}</p>
            <p className="text-xs text-stone-400 truncate">{user.email}</p>
          </div>
          {user.role === "admin" && (
            <a
              href={`${process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001"}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-stone-700 hover:bg-stone-50"
            >
              <LayoutDashboard className="w-4 h-4 text-stone-400" /> Admin Panel
            </a>
          )}
          <Link
            href="/dashboard/profile"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-stone-700 hover:bg-stone-50"
          >
            <User className="w-4 h-4 text-stone-400" /> My Profile
          </Link>
          <Link
            href="/dashboard/orders"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-stone-700 hover:bg-stone-50"
          >
            <Package className="w-4 h-4 text-stone-400" /> Orders
          </Link>
          <Link
            href="/dashboard/wishlist"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-stone-700 hover:bg-stone-50"
          >
            <Heart className="w-4 h-4 text-stone-400" /> Wishlist
          </Link>
          <button
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-rose-600 hover:bg-rose-50 text-left border-t border-stone-100"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

// ── Mobile Drawer Island ────────────────────────────────────────────────────

export function MobileDrawerIsland({
  categories,
}: {
  categories: Array<{ _id: string; name: string; slug: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const drawerContent = open ? (
    <div className="fixed inset-0 z-[100] flex">
      {/* Full Window Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Panel: Full Height of Viewport */}
      <div className="relative w-80 max-w-[85vw] bg-white h-screen sm:h-full max-h-[100dvh] shadow-2xl z-10 flex flex-col p-6 overflow-y-auto animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-stone-100">
          <span className="font-serif text-xl font-bold tracking-tight text-stone-900">
            Menu
          </span>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account Quick Strip (Mobile) */}
        {user ? (
          <div className="py-4 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-semibold uppercase">
                {user.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-900 truncate">{user.name}</p>
                <p className="text-xs text-stone-400 truncate">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-medium">
              <Link
                href="/dashboard/orders"
                onClick={() => setOpen(false)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-50 text-stone-700 hover:bg-stone-100"
              >
                <Package className="w-3.5 h-3.5 text-stone-500" /> Orders
              </Link>
              <Link
                href="/dashboard/wishlist"
                onClick={() => setOpen(false)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-50 text-stone-700 hover:bg-stone-100"
              >
                <Heart className="w-3.5 h-3.5 text-stone-500" /> Wishlist
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-4 border-b border-stone-100">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 transition-colors"
            >
              Sign In / Register
            </Link>
          </div>
        )}

        {/* Primary Navigation Links */}
        <nav className="py-5 space-y-3.5">
          <Link
            href="/products?sort=-createdAt"
            onClick={() => setOpen(false)}
            className="block text-sm font-semibold tracking-wide uppercase text-stone-900 hover:text-stone-600"
          >
            New Arrivals
          </Link>
          <Link
            href="/products?gender=women"
            onClick={() => setOpen(false)}
            className="block text-sm font-semibold tracking-wide uppercase text-stone-900 hover:text-stone-600"
          >
            Women
          </Link>
          <Link
            href="/products?gender=men"
            onClick={() => setOpen(false)}
            className="block text-sm font-semibold tracking-wide uppercase text-stone-900 hover:text-stone-600"
          >
            Men
          </Link>
          <Link
            href="/products?gender=kids"
            onClick={() => setOpen(false)}
            className="block text-sm font-semibold tracking-wide uppercase text-stone-900 hover:text-stone-600"
          >
            Kids
          </Link>
          <Link
            href="/products?sort=-discount"
            onClick={() => setOpen(false)}
            className="block text-sm font-semibold tracking-wide uppercase text-amber-800 hover:text-amber-900 font-bold"
          >
            Seasonal Sale
          </Link>

          {/* Categories Section */}
          {categories.length > 0 && (
            <div className="pt-4 border-t border-stone-100 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                Categories
              </p>
              {categories.map((c) => (
                <Link
                  key={c._id}
                  href={`/products?category=${c._id}`}
                  onClick={() => setOpen(false)}
                  className="block text-sm text-stone-600 hover:text-stone-900"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* Footer / Secondary Links */}
        <div className="mt-auto pt-5 border-t border-stone-100 space-y-2.5 text-xs text-stone-500">
          <Link
            href="/track-order"
            onClick={() => setOpen(false)}
            className="block hover:text-stone-900"
          >
            Track Your Order
          </Link>
          <Link
            href="/about"
            onClick={() => setOpen(false)}
            className="block hover:text-stone-900"
          >
            About Our Brand
          </Link>
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="block hover:text-stone-900"
          >
            Help & Contact
          </Link>
          {user && (
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 pt-2 text-xs font-medium"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mounted && drawerContent ? createPortal(drawerContent, document.body) : null}
    </div>
  );
}
