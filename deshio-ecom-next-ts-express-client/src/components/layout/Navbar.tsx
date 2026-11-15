import React from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { fetchApi } from "@/lib/api";
import { getSiteSettings } from "@/lib/settings";
import {
  SearchIsland,
  CartTriggerIsland,
  UserAccountIsland,
  MobileDrawerIsland,
} from "./NavbarClientIslands";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export default async function Navbar() {
  let categories: Category[] = [];
  let settings = null;

  try {
    const [catRes, siteSettings] = await Promise.all([
      fetchApi<Category[]>("/categories", {
        next: { revalidate: 3600 },
      }),
      getSiteSettings(),
    ]);
    categories = catRes.data ?? [];
    settings = siteSettings;
  } catch {
    categories = [
      { _id: "men", name: "Men's Wear", slug: "mens-wear" },
      { _id: "women", name: "Women's Collection", slug: "womens-collection" },
      { _id: "kids", name: "Kids & Teens", slug: "kids" },
      { _id: "traditional", name: "Ethnic & Heritage", slug: "ethnic-heritage" },
    ];
  }

  const brandName = settings?.siteName || siteConfig.shortName;
  const brandTagline = settings?.tagline || "Haute & Contemporary";
  const brandLogo = settings?.logoUrl;
  const showAnnouncement = settings?.showAnnouncement !== false;
  const announcement =
    settings?.announcementText ||
    "Complimentary Express Shipping on Orders Above ৳2,500";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80">
      {/* Top Announcement Bar */}
      {showAnnouncement && announcement && (
        <div className="bg-stone-900 text-stone-200 text-[10px] sm:text-[11px] font-medium tracking-wide sm:tracking-wider uppercase py-1.5 sm:py-2 px-3 sm:px-4 text-center">
          <span>{announcement}</span>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-20 sm:min-h-24 lg:min-h-28 py-2 sm:py-3 gap-3 lg:gap-6">
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <MobileDrawerIsland
              categories={categories}
              brandName={brandName}
              brandLogo={brandLogo}
            />
          </div>

          {/* Brand Logo - Centered on Mobile, Left-aligned on Desktop */}
          <div className="flex-1 lg:flex-initial flex items-center justify-center lg:justify-start">
            <Link href="/" className="group flex flex-col items-center lg:items-start py-1">
              {brandLogo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={brandLogo}
                  alt={brandName}
                  className="h-16 sm:h-20 lg:h-24 w-auto max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <>
                  <span className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-900 group-hover:text-stone-700 transition-colors leading-none">
                    {brandName}
                  </span>
                  <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] font-bold text-stone-500 mt-1 hidden sm:block">
                    {brandTagline}
                  </span>
                </>
              )}
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {siteConfig.navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`text-sm font-semibold uppercase tracking-widest transition-colors py-2 ${
                  item.highlight
                    ? "text-amber-800 hover:text-amber-950 font-bold"
                    : "text-stone-700 hover:text-stone-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Islands */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search icon (shown on both mobile and desktop like the reference design) */}
            <SearchIsland />
            <div className="hidden lg:block">
              <UserAccountIsland />
            </div>
            <CartTriggerIsland />
          </div>
        </div>
      </div>
    </header>
  );
}
