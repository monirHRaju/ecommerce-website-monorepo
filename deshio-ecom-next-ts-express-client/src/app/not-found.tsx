import Link from "next/link";
import { ArrowLeft, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6 py-16">
      <div className="text-center max-w-lg w-full">
        <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-800 mb-3">
          Error 404
        </span>
        <p className="font-serif text-7xl sm:text-8xl font-normal text-stone-900 tracking-tight mb-4">
          404
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 mb-3">
          This Look Isn&apos;t in Our Archive
        </h1>
        <p className="text-stone-500 text-sm leading-relaxed font-light mb-8">
          The page or garment you are looking for may have been moved, sold out,
          or retired from our seasonal collection.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-stone-900 text-white text-xs font-semibold uppercase tracking-widest hover:bg-stone-800 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Return Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-stone-300 bg-white text-stone-800 text-xs font-semibold uppercase tracking-widest hover:bg-stone-100 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            Browse Catalog
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-200">
          <p className="text-[11px] text-stone-400 mb-4 uppercase tracking-widest font-semibold">
            Explore Collections
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "Women", href: "/gender/women" },
              { label: "Men", href: "/gender/men" },
              { label: "Unisex", href: "/gender/unisex" },
              { label: "All Garments", href: "/products" },
              { label: "Track Order", href: "/track-order" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="px-3.5 py-1.5 rounded-full bg-white border border-stone-200 text-xs text-stone-700 hover:border-stone-900 hover:text-stone-900 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
