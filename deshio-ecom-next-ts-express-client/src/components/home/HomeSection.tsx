import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Product } from "@/types";
import ProductCard from "@/components/products/ProductCard";

interface HomeSectionProps {
  title: string;
  href: string;
  products: Product[];
}

/** Section header is a link: tapping the title / "View all" opens the full list. */
export function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 mb-3 sm:mb-5"
      aria-label={`View all ${title}`}
    >
      <h2 className="text-base sm:text-2xl font-semibold text-stone-900 tracking-tight group-hover:text-amber-800 transition-colors">
        {title}
      </h2>
      <span className="inline-flex items-center gap-0.5 text-xs sm:text-sm font-medium text-stone-500 group-hover:text-amber-800 shrink-0">
        View all
        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export default function HomeSection({ title, href, products }: HomeSectionProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <SectionHeader title={title} href={href} />
        {/* 2 per row on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
