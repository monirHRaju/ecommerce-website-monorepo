import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Product } from "@/types";
import ProductCard from "@/components/products/ProductCard";

interface ProductShowcaseProps {
  title: string;
  subtitle?: string;
  badge?: string;
  viewAllLink: string;
  viewAllText?: string;
  products: Product[];
  bgColor?: string;
}

export default function ProductShowcase({
  title,
  subtitle,
  badge,
  viewAllLink,
  viewAllText = "View All",
  products,
  bgColor = "bg-white",
}: ProductShowcaseProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className={`py-16 sm:py-20 ${bgColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            {badge && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-semibold tracking-wider uppercase mb-3 border border-stone-200">
                <Sparkles className="w-3 h-3 text-amber-700" />
                <span>{badge}</span>
              </div>
            )}
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-stone-500 text-sm sm:text-base mt-1.5 font-light">
                {subtitle}
              </p>
            )}
          </div>
          <Link
            href={viewAllLink}
            className="inline-flex items-center gap-1.5 text-stone-900 font-medium text-sm hover:text-amber-800 transition-colors group shrink-0"
          >
            <span>{viewAllText}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Product Grid — STRICTLY SINGLE COLUMN ON MOBILE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
