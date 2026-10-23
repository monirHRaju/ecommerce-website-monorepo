import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, User } from "lucide-react";

export const metadata: Metadata = {
  title: "The Journal — Style Guides, Textile Stories & Care Notes | Deshio",
  description:
    "Explore the Deshio Editorial Journal for seasonal lookbooks, Jamdani weaving stories, natural fabric care guides, and festive wardrobe curation.",
  openGraph: {
    title: "The Deshio Journal — Fashion & Textile Stories",
    description:
      "Curated style guides, heritage handloom spotlights, and garment care wisdom.",
    type: "website",
  },
};

interface Article {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  ctaHref: string;
  featured?: boolean;
}

const articles: Article[] = [
  {
    slug: "art-of-jamdani-weaving",
    category: "Heritage Craft",
    title: "The Living Loom: Inside Sonargaon's Centuries-Old Jamdani Tradition",
    excerpt:
      "Each genuine Jamdani saree takes weeks of synchronized hand-weaving using fine muslin warp and supplementary discontinuous weft motifs. Discover how our partner weavers keep this UNESCO-recognized art thriving.",
    author: "Nadia Rahman",
    date: "October 12, 2026",
    readTime: "6 min read",
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&auto=format&fit=crop&q=80",
    ctaHref: "/gender/women",
    featured: true,
  },
  {
    slug: "festive-panjabi-styling-guide",
    category: "Style Guide",
    title: "How to Choose the Ideal Panjabi Silhouette for Festive Evenings",
    excerpt:
      "From crisp bandhgala collars in textured tussar silk to breathable tone-on-tone embroidered cotton — a gentleman's guide to effortless festive dressing.",
    author: "Tariq Ahmed",
    date: "October 4, 2026",
    readTime: "5 min read",
    image:
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80",
    ctaHref: "/gender/men",
  },
  {
    slug: "caring-for-pure-linen-and-handloom",
    category: "Garment Care",
    title: "5 Essential Rules for Preserving Pure Linen & Handloom Cotton",
    excerpt:
      "Natural fibers grow softer and more expressive with age when washed gently. Learn our atelier's cold-wash, shade-dry, and steam-pressing rituals.",
    author: "Meher Afroz",
    date: "September 25, 2026",
    readTime: "4 min read",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80",
    ctaHref: "/products",
  },
  {
    slug: "capsule-wardrobe-tropical-climate",
    category: "Wardrobe Edit",
    title: "Building a 7-Piece Breathable Capsule Wardrobe for Dhaka's Climate",
    excerpt:
      "Beat humidity without compromising polish. See how neutral earth tones, relaxed linen shirts, and versatile co-ord sets transition seamlessly from desk to dinner.",
    author: "Zara Chowdhury",
    date: "September 14, 2026",
    readTime: "7 min read",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
    ctaHref: "/products",
  },
  {
    slug: "natural-dyes-and-earthy-palettes",
    category: "Sustainability",
    title: "Why We Favor Earthy Pigments & Low-Impact Azo-Free Dyes",
    excerpt:
      "From indigo and madder root to warm ochre and charcoal stone — how thoughtful dye chemistry protects both sensitive skin and local waterways.",
    author: "Nadia Rahman",
    date: "September 2, 2026",
    readTime: "5 min read",
    image:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop&q=80",
    ctaHref: "/about",
  },
  {
    slug: "kids-organic-cotton-comfort",
    category: "Family Edit",
    title: "Soft on Young Skin: Why 100% Combed Organic Cotton Matters for Kids",
    excerpt:
      "Children's clothing should move freely and breathe effortlessly. Explore our tag-free, pre-shrunk cotton sets designed for active play.",
    author: "Meher Afroz",
    date: "August 19, 2026",
    readTime: "4 min read",
    image:
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80",
    ctaHref: "/gender/kids",
  },
];

export default function BlogPage() {
  const featured = articles.find((a) => a.featured)!;
  const rest = articles.filter((a) => !a.featured);

  return (
    <div className="min-h-screen bg-stone-50/30">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-stone-200 py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold uppercase tracking-widest mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            The Deshio Journal
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl text-stone-900 tracking-tight mb-4">
            Notes on Craft, Style & Slow Living
          </h1>
          <p className="text-stone-500 text-sm sm:text-base max-w-xl mx-auto font-light leading-relaxed">
            Stories from our weaving clusters, seasonal lookbooks, and practical
            guides to caring for natural textiles.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        {/* ── Featured Story ──────────────────────────────────────────── */}
        <article className="grid lg:grid-cols-12 rounded-2xl overflow-hidden bg-white border border-stone-200 shadow-2xs">
          <div className="lg:col-span-7 relative min-h-[280px] sm:min-h-[380px] bg-stone-100">
            <Image
              src={featured.image}
              alt={featured.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover"
            />
            <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-stone-900/90 text-white text-[11px] font-semibold uppercase tracking-wider">
              Featured Essay
            </span>
          </div>

          <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-800">
                {featured.category}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 mt-2 mb-4 leading-snug">
                {featured.title}
              </h2>
              <p className="text-stone-600 text-sm leading-relaxed font-light mb-6">
                {featured.excerpt}
              </p>
            </div>

            <div className="pt-6 border-t border-stone-100 flex items-center justify-between gap-4">
              <div className="text-xs text-stone-500 space-y-0.5">
                <p className="font-medium text-stone-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  {featured.author}
                </p>
                <p className="flex items-center gap-1.5 text-stone-400">
                  <Clock className="w-3.5 h-3.5" />
                  {featured.date} · {featured.readTime}
                </p>
              </div>

              <Link
                href={featured.ctaHref}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 transition-colors"
              >
                Explore Edit
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </article>

        {/* ── Recent Stories Grid ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-2xl text-stone-900">
              Recent Dispatches
            </h2>
            <span className="text-xs text-stone-400 uppercase tracking-widest">
              {rest.length} Stories
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((article) => (
              <article
                key={article.slug}
                className="rounded-2xl bg-white border border-stone-200 overflow-hidden flex flex-col hover:border-stone-300 transition-colors"
              >
                <div className="relative h-56 bg-stone-100">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/95 text-stone-800 text-[10px] font-semibold uppercase tracking-wider">
                    {article.category}
                  </span>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-serif text-lg text-stone-900 leading-snug mb-2.5">
                    {article.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed flex-1 mb-5">
                    {article.excerpt}
                  </p>

                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <span>
                      {article.author} · {article.readTime}
                    </span>
                    <Link
                      href={article.ctaHref}
                      className="font-semibold text-stone-900 hover:text-amber-800 inline-flex items-center gap-1 transition-colors"
                    >
                      Shop Edit
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
