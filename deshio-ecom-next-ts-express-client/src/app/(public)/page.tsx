import type { Metadata } from "next";
import { API_BASE } from "@/lib/api";
import { Product, Category } from "@/types";
import HeroSection from "@/components/home/HeroSection";
import FashionTrustStrip from "@/components/home/FashionTrustStrip";
import CategoryTiles from "@/components/home/CategoryTiles";
import ProductShowcase from "@/components/home/ProductShowcase";
import ShopByGender from "@/components/home/ShopByGender";
import FashionFAQ from "@/components/home/FashionFAQ";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Deshio — Timeless Elegance & Contemporary Fashion",
  description:
    "Discover curated luxury essentials, exquisite handlooms, and contemporary everyday wear crafted from breathable, premium fabrics. Nationwide delivery across Bangladesh.",
  openGraph: {
    title: "Deshio — Timeless Elegance & Contemporary Fashion",
    description:
      "Curated apparel, authentic handlooms, and modern wardrobe essentials in Bangladesh.",
    type: "website",
  },
};

async function getNewArrivals(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/products?limit=8&sort=-createdAt`, {
      next: { revalidate: 300, tags: ["products"] },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/products?isFeatured=true&limit=8`, {
      next: { revalidate: 300, tags: ["products"] },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      next: { revalidate: 300, tags: ["categories"] },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [newArrivals, featuredProducts, categories] = await Promise.all([
    getNewArrivals(),
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <main className="min-h-screen bg-stone-50/30">
      {/* 1. Hero — Editorial static CSS Hero (LCP priority) */}
      <HeroSection />

      {/* 2. Micro Trust Strip */}
      <FashionTrustStrip />

      {/* 3. Category Tiles */}
      <CategoryTiles categories={categories} />

      {/* 4. New Arrivals (Single column mobile) */}
      <ProductShowcase
        title="New Arrivals"
        subtitle="Fresh off the atelier — explore our newest seasonal silhouettes."
        badge="Just Landed"
        viewAllLink="/products?sort=-createdAt"
        viewAllText="Explore All New"
        products={newArrivals}
      />

      {/* 5. Shop by Gender / Lifestyle banners */}
      <ShopByGender />

      {/* 6. Featured Curator's Edit */}
      <ProductShowcase
        title="Curator's Edit"
        subtitle="Hand-picked seasonal highlights cherished by our community."
        badge="Community Favorites"
        viewAllLink="/products?isFeatured=true"
        viewAllText="View All Featured"
        products={featuredProducts}
        bgColor="bg-stone-50/50"
      />

      {/* 7. FAQ via native <details> */}
      <FashionFAQ />
    </main>
  );
}
