"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";

interface MobileFilterToggleProps {
  activeCount: number;
  totalCount?: number;
  basePath?: string;
  children: React.ReactNode;
}

export default function MobileFilterToggle({
  activeCount,
  totalCount,
  basePath = "/products",
  children,
}: MobileFilterToggleProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when drawer is open
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

  // Close on Escape key
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel for Mobile and Tablets */}
      <div
        className="relative w-84 max-w-[85vw] sm:w-96 sm:max-w-md bg-white h-screen sm:h-full max-h-[100dvh] shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-left duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Filter products"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-stone-900" />
            <h3 className="font-serif font-bold text-base text-stone-900">
              Filters
            </h3>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-stone-900 text-white text-[11px] font-bold">
                {activeCount} active
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Filters Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-6">
          {children}
        </div>

        {/* Drawer Bottom Action Bar */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/95 backdrop-blur-xs shrink-0 flex items-center gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {activeCount > 0 && (
            <a
              href={basePath}
              onClick={() => setOpen(false)}
              className="px-3.5 py-2.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </a>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 py-3 px-4 rounded-lg bg-stone-900 text-white text-xs sm:text-sm font-semibold hover:bg-stone-800 transition-colors shadow-sm text-center"
          >
            {totalCount !== undefined
              ? `View ${totalCount} ${totalCount === 1 ? "Product" : "Products"}`
              : "Apply & View Products"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-stone-300 bg-white text-stone-800 text-xs font-semibold hover:bg-stone-50 active:scale-[0.99] transition-all lg:hidden shadow-xs"
        aria-label="Open filter sidebar"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {mounted && drawerContent ? createPortal(drawerContent, document.body) : null}
    </>
  );
}
