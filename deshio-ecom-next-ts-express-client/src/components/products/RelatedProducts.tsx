"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import api from "@/lib/axios";
import { Product } from "@/types";
import ProductCard from "./ProductCard";
import ProductSkeleton from "./ProductSkeleton";

interface Props {
  categoryId: string;
  excludeId: string;
}

export default function RelatedProducts({ categoryId, excludeId }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery<Product[]>({
    queryKey: ["related", categoryId, excludeId],
    queryFn: async () => {
      const res = await api.get(`/products?category=${categoryId}&limit=8`);
      return (res.data.data as Product[]).filter((p) => p._id !== excludeId);
    },
    enabled: !!categoryId,
  });

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            You May Also Admire
          </h2>
          <p className="text-xs text-stone-500 font-light mt-0.5">
            Curated complements from the same design house.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="w-9 h-9 rounded-full border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 flex items-center justify-center transition-colors shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="w-9 h-9 rounded-full border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 flex items-center justify-center transition-colors shadow-xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
      >
        {isLoading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="w-64 shrink-0 snap-start">
                <ProductSkeleton />
              </div>
            ))
          : data!.map((product) => (
              <div key={product._id} className="w-64 shrink-0 snap-start">
                <ProductCard product={product} />
              </div>
            ))}
      </div>
    </section>
  );
}
