import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Top bar */}
      <header className="p-5 sm:p-6 border-b border-stone-200/70 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-serif text-2xl tracking-tight text-stone-900 hover:opacity-80 transition-opacity"
          >
            <ShoppingBag className="w-5 h-5 text-amber-800" />
            Deshio
          </Link>
          <Link
            href="/products"
            className="text-xs font-semibold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {children}
      </main>

      {/* Bottom note */}
      <footer className="text-center py-5 text-xs text-stone-400 border-t border-stone-200/60 bg-white">
        © {new Date().getFullYear()} Deshio Fashion. All rights reserved.
      </footer>
    </div>
  );
}
