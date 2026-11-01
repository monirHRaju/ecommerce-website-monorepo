import Image from "next/image";
import Link from "next/link";
import { Category } from "@/types";
import { SectionHeader } from "./HomeSection";

interface TopCategoriesProps {
  title: string;
  href: string;
  categories: Category[];
}

export default function TopCategories({ title, href, categories }: TopCategoriesProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <SectionHeader title={title} href={href} />
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-x-2 gap-y-4 sm:gap-6">
          {categories.map((c) => (
            <Link
              key={c._id}
              href={`/category/${c.slug}`}
              className="group flex flex-col items-center gap-1.5 text-center"
            >
              <span className="relative block w-full max-w-[84px] sm:max-w-[110px] aspect-square rounded-full overflow-hidden bg-stone-100 border border-stone-200 group-hover:border-stone-400 transition-colors">
                {c.image ? (
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    sizes="110px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-lg sm:text-2xl font-semibold text-stone-500">
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="text-[11px] sm:text-sm font-medium text-stone-800 leading-tight line-clamp-2">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
