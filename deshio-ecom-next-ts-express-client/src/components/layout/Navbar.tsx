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
        <div className="bg-stone-900 text-stone-200 text-[11px] font-medium tracking-wider uppercase py-2 px-4 text-center">
          <span>{announcement}</span>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Mobile Menu Button */}
          <MobileDrawerIsland categories={categories} />

          {/* Brand Logo */}
          <div className="flex-1 lg:flex-initial flex items-center justify-center lg:justify-start">
            <Link href="/" className="group flex flex-col items-center lg:items-start">
              {brandLogo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={brandLogo}
                  alt={brandName}
                  className="h-9 w-auto max-w-[160px] object-contain"
                />
              ) : (
                <>
                  <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 group-hover:text-stone-700 transition-colors">
                    {brandName}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest font-semibold text-stone-500 -mt-1 hidden sm:block">
                    {brandTagline}
                  </span>
                </>
              )}
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {siteConfig.navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`text-xs font-semibold uppercase tracking-widest transition-colors py-2 ${
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
            <SearchIsland />
            <UserAccountIsland />
            <CartTriggerIsland />
          </div>
        </div>
      </div>
    </header>
  );
}
