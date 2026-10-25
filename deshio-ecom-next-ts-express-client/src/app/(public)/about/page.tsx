import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  Compass,
  Heart,
  Layers,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const name = settings?.siteName || "Deshio";
  return {
    title: `Our Story — Heritage Craft & Contemporary Fashion | ${name}`,
    description:
      settings?.aboutHeroSubtitle ||
      `Discover the story behind ${name} — bridging centuries-old Bangladeshi handloom artistry with refined contemporary silhouettes.`,
    openGraph: {
      title: `About ${name} — Heritage & Contemporary Fashion`,
      description:
        settings?.aboutHeroSubtitle ||
        "Thoughtfully tailored garments crafted from breathable natural fibers and authentic Bangladeshi handlooms.",
      type: "website",
    },
  };
}

const defaultStats = [
  { value: "45K+", label: "Patrons Across Bangladesh" },
  { value: "180+", label: "Master Weavers & Artisans" },
  { value: "64", label: "Districts Delivered" },
  { value: "99.2%", label: "Fit & Quality Satisfaction" },
];

const defaultPillars = [
  {
    title: "Breathable Natural Fibers",
    description:
      "Every garment begins with thoughtfully sourced textiles — combed organic cotton, pure linen, mulberry silk, and hand-spun muslin engineered for our tropical climate.",
  },
  {
    title: "Artisanal Heritage",
    description:
      "We collaborate directly with weaving clusters in Tangail, Sonargaon, and Sirajganj to preserve authentic Jamdani and handloom traditions with fair artisan wages.",
  },
  {
    title: "Architectural Tailoring",
    description:
      "Our Dhaka atelier refines every pattern through multiple fittings, ensuring clean drapes, reinforced seams, and effortless movement from morning to evening.",
  },
  {
    title: "Uncompromising Quality",
    description:
      "Each piece undergoes a 12-point garment inspection for colorfastness, stitch density, and fabric finish before it leaves our studio.",
  },
  {
    title: "Effortless Size Exchanges",
    description:
      "Finding your ideal fit should be worry-free. We offer a seamless 7-day size exchange and return policy across all collections.",
  },
  {
    title: "Nationwide Doorstep Delivery",
    description:
      "From express dispatch inside Dhaka to reliable courier coverage across all 64 districts, with Cash on Delivery and Mobile Banking options.",
  },
];

const defaultMilestones = [
  {
    year: "2020",
    title: "The Atelier Begins in Dhaka",
    description:
      "Founded with a capsule collection of 12 handloom Panjabis and breathable everyday Kurtis crafted alongside five master tailors.",
  },
  {
    year: "2022",
    title: "Direct Weaver Partnerships",
    description:
      "Established direct partnerships with weaving communities in Tangail and Narayanganj, eliminating middlemen and elevating textile purity.",
  },
  {
    year: "2024",
    title: "Contemporary Ready-to-Wear Expansion",
    description:
      "Introduced women's Festive Sarees, tailored linen co-ords, and children's organic cotton wear, serving over 30,000 customers nationwide.",
  },
  {
    year: "Today",
    title: "A Modern Bangladeshi Wardrobe",
    description:
      "Continuing to blend timeless heritage craftsmanship with minimalist modern design for discerning dressers across Bangladesh.",
  },
];

const pillarIcons = [Layers, Sparkles, Compass, ShieldCheck, Heart, Truck];
const statIcons = [Users, Sparkles, Truck, Award];

export default async function AboutPage() {
  const settings = await getSiteSettings();

  const heroBadge = settings?.aboutHeroBadge || "Our Heritage & Philosophy";
  const heroTitle = settings?.aboutHeroTitle || "Rooted in Craft. Tailored for Today.";
  const heroSubtitle =
    settings?.aboutHeroSubtitle ||
    "Deshio was born from a simple conviction: everyday clothing in Bangladesh should honor our rich textile heritage while embracing clean, contemporary tailoring and breathable comfort.";

  const storyBadge = settings?.aboutStoryBadge || "The Deshio Standard";
  const storyTitle =
    settings?.aboutStoryTitle || "Every Thread Tells a Story of Patience & Precision";
  const storyP1 =
    settings?.aboutStoryParagraph1 ||
    "In an era of disposable fast fashion, we choose a slower, more deliberate path. Our design studio in Dhaka works hand-in-hand with generational weavers across rural Bangladesh to develop slow textiles that soften with every wash.";
  const storyP2 =
    settings?.aboutStoryParagraph2 ||
    "Whether it is a festive embroidered Panjabi, a hand-woven Jamdani saree, or an everyday relaxed linen shirt, every silhouette is proportioned for effortless grace and lasting durability.";

  const stats = settings?.aboutStats?.length ? settings.aboutStats : defaultStats;
  const pillars = settings?.aboutPillars?.length ? settings.aboutPillars : defaultPillars;
  const milestones = settings?.aboutMilestones?.length
    ? settings.aboutMilestones
    : defaultMilestones;

  return (
    <div className="min-h-screen bg-stone-50/30">
      {/* ── Editorial Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-stone-900 text-stone-100 py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-[11px] uppercase tracking-[0.25em] text-amber-400 font-semibold mb-4">
            {heroBadge}
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight leading-tight mb-6">
            {heroTitle}
          </h1>
          <p className="text-stone-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-light mb-10">
            {heroSubtitle}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/products"
              className="px-7 py-3.5 rounded-full bg-white text-stone-900 text-xs font-semibold uppercase tracking-widest hover:bg-stone-100 transition-colors"
            >
              Explore the Collection
            </Link>
            <Link
              href="/contact"
              className="px-7 py-3.5 rounded-full border border-stone-700 text-stone-200 text-xs font-semibold uppercase tracking-widest hover:bg-stone-800 transition-colors"
            >
              Visit Our Studio
            </Link>
          </div>
        </div>
      </section>

      {/* ── Key Figures Strip ───────────────────────────────────────────── */}
      <section className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map(({ value, label }, idx) => {
              const Icon = statIcons[idx % statIcons.length];
              return (
                <div key={idx} className="text-center">
                  <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200/60 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-4 h-4 text-amber-800" />
                  </div>
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                    {value}
                  </p>
                  <p className="text-xs text-stone-500 mt-1 tracking-wide">{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Craftsmanship Narrative ─────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <span className="text-[11px] uppercase tracking-[0.2em] text-amber-800 font-semibold">
              {storyBadge}
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl text-stone-900 tracking-tight leading-snug">
              {storyTitle}
            </h2>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed font-light">
              {storyP1}
            </p>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed font-light">
              {storyP2}
            </p>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-stone-900 text-stone-100 p-6 sm:p-8 flex flex-col justify-between min-h-[210px]">
              <span className="text-xs uppercase tracking-widest text-amber-400">
                01 / Material
              </span>
              <div>
                <h3 className="font-serif text-xl mb-1.5">100% Breathable</h3>
                <p className="text-xs text-stone-400 font-light leading-relaxed">
                  Pure cotton, linen, and artisanal silk blends selected for all-day comfort.
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-amber-50 border border-amber-200/70 text-stone-900 p-6 sm:p-8 flex flex-col justify-between min-h-[210px]">
              <span className="text-xs uppercase tracking-widest text-amber-900">
                02 / Craft
              </span>
              <div>
                <h3 className="font-serif text-xl mb-1.5">Small-Batch Cuts</h3>
                <p className="text-xs text-stone-600 font-light leading-relaxed">
                  Produced in limited runs to ensure meticulous tailoring and zero textile waste.
                </p>
              </div>
            </div>
            <div className="col-span-2 rounded-2xl bg-white border border-stone-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold">
                  03 / Community
                </span>
                <h3 className="font-serif text-xl text-stone-900 mt-1">
                  Supporting Local Weaving Clusters
                </h3>
                <p className="text-xs text-stone-500 mt-1 font-light">
                  Fair-trade partnerships across Tangail, Sonargaon, and Sirajganj.
                </p>
              </div>
              <Link
                href="/gender/women"
                className="shrink-0 px-5 py-2.5 rounded-full bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 transition-colors text-center"
              >
                View Handlooms
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pillars ─────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white border-y border-stone-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] uppercase tracking-[0.2em] text-amber-800 font-semibold">
              Why Choose {settings?.siteName || "Deshio"}
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl text-stone-900 mt-2">
              Pillars of Our House
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map(({ title, description }, idx) => {
              const Icon = pillarIcons[idx % pillarIcons.length];
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-stone-200/80 bg-stone-50/40 p-6 hover:border-stone-300 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif text-lg text-stone-900 mb-2">{title}</h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light">
                    {description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Journey Timeline ────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[11px] uppercase tracking-[0.2em] text-amber-800 font-semibold">
            Chronicle
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl text-stone-900 mt-2">
            Our Journey So Far
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {milestones.map((m, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white border border-stone-200 p-6 shadow-2xs"
            >
              <span className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold mb-3">
                {m.year}
              </span>
              <h3 className="font-serif text-lg text-stone-900 mb-1.5">{m.title}</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light">
                {m.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
