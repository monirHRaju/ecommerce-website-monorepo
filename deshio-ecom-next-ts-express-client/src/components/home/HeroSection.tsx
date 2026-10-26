import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, ShieldCheck, Truck, RefreshCw } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-stone-50 border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Editorial Copy */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-200/60 text-stone-800 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Spring / Summer 2026 Collection</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight text-stone-900 leading-[1.15]">
              Timeless Elegance, <br />
              <span className="italic font-normal text-stone-700">Modern Expression.</span>
            </h1>

            <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg text-stone-600 leading-relaxed font-light">
              Discover curated luxury essentials, exquisite handlooms, and contemporary everyday wear crafted from breathable, premium fabrics.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 transition-all shadow-sm group"
              >
                <span>Shop All Collections</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/products?gender=women"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border border-stone-300 bg-white text-stone-900 font-medium text-sm hover:bg-stone-100 transition-colors"
              >
                <span>Women&apos;s Wear</span>
              </Link>
              <Link
                href="/products?gender=men"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border border-stone-300 bg-white text-stone-900 font-medium text-sm hover:bg-stone-100 transition-colors"
              >
                <span>Men&apos;s Wear</span>
              </Link>
            </div>

            {/* Micro Trust Strip */}
            <div className="pt-8 grid grid-cols-3 gap-4 border-t border-stone-200/70 text-left max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-stone-700 shrink-0" />
                <span className="text-xs font-medium text-stone-700">100% Pure Fabric</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-stone-700 shrink-0" />
                <span className="text-xs font-medium text-stone-700">Fast Nationwide Delivery</span>
              </div>
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 text-stone-700 shrink-0" />
                <span className="text-xs font-medium text-stone-700">7-Day Easy Exchange</span>
              </div>
            </div>
          </div>

          {/* Right Visual Image */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl bg-stone-200">
              <Image
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=80"
                alt="Editorial Fashion Collection"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                className="object-cover object-top hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-white/90 backdrop-blur-md border border-white/40 shadow-lg">
                <p className="text-[10px] uppercase font-bold tracking-widest text-amber-800">Featured</p>
                <p className="text-sm font-semibold text-stone-900 mt-0.5">Heritage Silk & Contemporary Cotton</p>
                <p className="text-xs text-stone-500 mt-0.5">Starting from ৳1,450</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
