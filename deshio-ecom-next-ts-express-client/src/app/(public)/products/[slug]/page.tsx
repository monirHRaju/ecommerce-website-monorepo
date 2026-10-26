import type { Metadata } from "next";
import { notFound, redirect, RedirectType } from "next/navigation";
import Link from "next/link";
import { Star, Share2 } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { Product } from "@/types";
import ImageGallery from "@/components/products/ImageGallery";
import AddToCartPanel from "@/components/products/AddToCartPanel";
import FashionProductDetails from "@/components/products/FashionProductDetails";
import ReviewSection from "@/components/products/ReviewSection";
import RelatedProducts from "@/components/products/RelatedProducts";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const revalidate = 300;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slugOrId: string): Promise<Product | null> {
  let param = slugOrId;
  try {
    param = encodeURIComponent(decodeURIComponent(slugOrId));
  } catch {
    param = slugOrId;
  }

  try {
    const res = await fetch(`${API_BASE}/products/${param}`, {
      next: { revalidate: 300, tags: ["products"] },
    });
    if (!res.ok) {
      console.warn(`[getProduct] ${res.status} for ${API_BASE}/products/${param}`);
      return null;
    }
    const json = await res.json();
    return json.data || null;
  } catch (err: any) {
    console.error(`[getProduct] Fetch error for ${API_BASE}/products/${param}:`, err?.message || err);
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_BASE}/products/slugs`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const items = json.data as Array<{ slug?: string }>;
    return items.filter((i) => Boolean(i.slug)).map((i) => ({ slug: i.slug! }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Garment Not Found — Deshio",
    };
  }

  const categoryName =
    typeof product.category === "object" ? product.category?.name : undefined;

  return {
    title: `${product.title} — Deshio Fashion`,
    description:
      product.description.slice(0, 160) ||
      `Shop the exquisite ${product.title} tailored from premium fabrics at Deshio.`,
    openGraph: {
      title: `${product.title} — Deshio Fashion`,
      description: product.description.slice(0, 160),
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
      type: "website",
    },
    alternates: {
      canonical: product.slug ? `/products/${product.slug}` : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {
    decodedSlug = slug;
  }
  const product = await getProduct(decodedSlug);

  if (!product) {
    notFound();
  }

  // If visited via ObjectId but product has a slug, 308 redirect for SEO
  if (product.slug && decodedSlug.toLowerCase() !== product.slug.toLowerCase()) {
    redirect(`/products/${encodeURIComponent(product.slug)}`, RedirectType.replace);
  }

  const categoryObj = typeof product.category === "object" ? product.category : null;
  const categoryId = categoryObj?._id || (typeof product.category === "string" ? product.category : "");

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://deshio.com";
  const productUrl = `${baseUrl}/products/${product.slug || product._id}`;

  const breadcrumbItems = [
    { name: "Home", url: `${baseUrl}` },
    { name: "Catalog", url: `${baseUrl}/products` },
    ...(categoryObj
      ? [{ name: categoryObj.name, url: `${baseUrl}/category/${categoryObj.slug}` }]
      : []),
    ...(product.gender
      ? [
          {
            name: product.gender.charAt(0).toUpperCase() + product.gender.slice(1),
            url: `${baseUrl}/gender/${product.gender}`,
          },
        ]
      : []),
    { name: product.title, url: productUrl },
  ];

  return (
    <div className="min-h-screen bg-stone-50/30">
      <ProductJsonLd product={product} url={productUrl} />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* ── Breadcrumb Navigation ─────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-xs text-stone-400 mb-8 overflow-x-auto pb-1">
          <Link href="/" className="hover:text-stone-700 transition-colors shrink-0">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-stone-700 transition-colors shrink-0">
            Catalog
          </Link>
          {categoryObj && (
            <>
              <span>/</span>
              <Link
                href={`/category/${categoryObj.slug}`}
                className="hover:text-stone-700 transition-colors shrink-0"
              >
                {categoryObj.name}
              </Link>
            </>
          )}
          {product.gender && (
            <>
              <span>/</span>
              <Link
                href={`/gender/${product.gender}`}
                className="hover:text-stone-700 transition-colors shrink-0 capitalize"
              >
                {product.gender}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-stone-700 truncate font-medium max-w-xs">{product.title}</span>
        </nav>

        {/* ── Product Hero Layout ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Visual Media Gallery (5 cols) */}
          <div className="lg:col-span-6 xl:col-span-6 lg:sticky lg:top-28">
            <ImageGallery images={product.images} title={product.title} />
          </div>

          {/* Right Column: Garment Information & Purchase Island (6 cols) */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-5">
            {/* Department & Gender Tags */}
            <div className="flex items-center gap-2">
              {categoryObj && (
                <Link
                  href={`/category/${categoryObj.slug}`}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
                >
                  {categoryObj.name}
                </Link>
              )}
              {product.gender && (
                <Link
                  href={`/gender/${product.gender}`}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200"
                >
                  {product.gender}
                </Link>
              )}
            </div>

            {/* Product Title */}
            <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight leading-tight">
              {product.title}
            </h1>

            {/* Rating & Social proof */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-stone-800">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold">{product.rating ? product.rating.toFixed(1) : "5.0"}</span>
              </div>
              <span className="text-stone-300">•</span>
              <span className="text-xs text-stone-500 font-light">
                {product.reviewCount || 0} customer reviews
              </span>
              {product.sold > 0 && (
                <>
                  <span className="text-stone-300">•</span>
                  <span className="text-xs text-stone-500 font-light">
                    {product.sold} ordered this season
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-stone-600 text-sm sm:text-base font-light leading-relaxed">
              {product.description}
            </p>

            {/* Interactive Add to Bag Island */}
            <AddToCartPanel product={product} />

            {/* Craftsmanship, Material & Care Details */}
            <FashionProductDetails product={product} />
          </div>
        </div>

        {/* ── Customer Reviews & Social Proof ────────────────────────── */}
        <div className="mt-16 sm:mt-24 pt-12 border-t border-stone-200">
          <ReviewSection productId={product._id} />
        </div>

        {/* ── Related Collection Pieces ──────────────────────────────── */}
        {categoryId && (
          <div className="mt-16 sm:mt-24 pt-12 border-t border-stone-200">
            <RelatedProducts categoryId={categoryId} excludeId={product._id} />
          </div>
        )}
      </div>
    </div>
  );
}
