import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Category } from "@/types";

interface CategoryTilesProps {
  categories?: Category[];
}

const fallbackCategories = [
  {
    name: "Women's Collection",
    slug: "womens-wear",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700&q=80",
    itemCount: "Sarees, Kurtis & Dresses",
    badge: "Trending",
  },
  {
    name: "Men's Collection",
    slug: "mens-wear",
    image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=700&q=80",
    itemCount: "Panjabis, Shirts & Polos",
    badge: "New Styles",
  },
  {
    name: "Panjabi & Heritage",
    slug: "panjabi-kurta",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=700&q=80",
    itemCount: "Festive & Everyday Linen",
    badge: "Bestseller",
  },
  {
    name: "Handloom & Sarees",
    slug: "sarees-handlooms",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=700&q=80",
    itemCount: "Jamdani, Silk & Cotton",
    badge: "Artisanal",
  },
];

export default function CategoryTiles({ categories = [] }: CategoryTilesProps) {
  // If we have API categories, display top categories with appropriate images
  const displayItems =
    categories.length > 0
      ? categories.slice(0, 6).map((c, idx) => ({
          name: c.name,
          slug: c.slug,
          image:
            c.image ||
            fallbackCategories[idx % fallbackCategories.length].image,
          itemCount: c.description || "Curated Fashion Pieces",
          badge: idx === 0 ? "Bestseller" : idx === 1 ? "New Arrivals" : undefined,
        }))
      : fallbackCategories;

  return (
    <section className="py-16 sm:py-20 bg-stone-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200 text-stone-800 text-xs font-semibold tracking-wider uppercase mb-3">
              Explore Departments
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight">
              Curated Collections
            </h2>
            <p className="text-stone-500 text-sm sm:text-base mt-1.5 font-light">
              Explore timeless silhouettes tailored for contemporary life.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-stone-900 font-medium text-sm hover:text-amber-800 transition-colors group shrink-0"
          >
            <span>View All Departments</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Tiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayItems.map((item) => (
            <Link
              key={item.slug}
              href={`/products?category=${item.slug}`}
              className="group relative block rounded-2xl overflow-hidden aspect-[4/5] bg-stone-200 shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />

              {/* Badge */}
              {item.badge && (
                <div className="absolute top-3.5 left-3.5">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-white/95 text-stone-900 backdrop-blur-xs shadow-xs">
                    {item.badge}
                  </span>
                </div>
              )}

              {/* Text content */}
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-xs text-stone-300 font-light mb-1">{item.itemCount}</p>
                <h3 className="font-serif text-xl sm:text-2xl font-medium leading-snug group-hover:translate-x-0.5 transition-transform">
                  {item.name}
                </h3>
                <span className="inline-flex items-center gap-1 text-xs text-amber-200 font-medium mt-2 opacity-90 group-hover:opacity-100">
                  <span>Shop Collection</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
