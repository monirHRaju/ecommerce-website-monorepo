import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchCategories } from "@/lib/homepage";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "All Categories",
  description: "Browse all product categories.",
};

export default async function CategoriesPage() {
  const categories = await fetchCategories();

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-10">
      <h1 className="text-xl sm:text-3xl font-semibold text-stone-900 mb-4 sm:mb-6">Categories</h1>

      {categories.length === 0 ? (
        <p className="text-sm text-stone-500 py-16 text-center">No categories available yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5">
          {categories.map((c) => (
            <Link
              key={c._id}
              href={`/category/${c.slug}`}
              className="group relative block aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 border border-stone-200"
            >
              {c.image && (
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/10 to-transparent" />
              <span className="absolute bottom-2.5 left-3 right-3 text-sm sm:text-base font-semibold text-white leading-tight">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
