"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

interface MobileFilterToggleProps {
  activeCount: number;
  children: React.ReactNode;
}

export default function MobileFilterToggle({
  activeCount,
  children,
}: MobileFilterToggleProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-stone-300 bg-white text-stone-800 text-xs font-medium hover:bg-stone-50 transition-colors lg:hidden shadow-xs"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {/* Slide-over Drawer for Mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setOpen(false)}
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-2xl flex flex-col z-10 overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-stone-800" />
                <h3 className="font-semibold text-sm text-stone-900">Filters</h3>
                {activeCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 text-xs font-semibold">
                    {activeCount} active
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">{children}</div>

            <div className="p-4 border-t border-stone-200 bg-stone-50">
              <button
                onClick={() => setOpen(false)}
                className="w-full py-2.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                Apply & View Products
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
