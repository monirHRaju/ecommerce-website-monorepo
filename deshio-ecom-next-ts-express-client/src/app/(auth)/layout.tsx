import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { siteConfig } from "@/lib/site";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  const brandName = settings?.siteName || siteConfig.shortName;
  const brandLogo = settings?.logoUrl;
  const copyright = settings?.copyrightText
    ? settings.copyrightText
        .replace("{year}", String(new Date().getFullYear()))
        .replace("{siteName}", brandName)
    : `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Top bar */}
      <header className="p-5 sm:p-6 border-b border-stone-200/70 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-serif text-2xl sm:text-3xl tracking-tight text-stone-900 hover:opacity-80 transition-opacity"
          >
            {brandLogo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={brandLogo}
                alt={brandName}
                className="h-12 sm:h-14 lg:h-16 w-auto max-w-[200px] sm:max-w-[240px] object-contain"
              />
            ) : (
              <>
                <ShoppingBag className="w-6 h-6 text-amber-800" />
                <span>{brandName}</span>
              </>
            )}
          </Link>
          <Link
            href="/products"
            className="text-xs font-semibold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {children}
      </main>

      {/* Bottom note */}
      <footer className="text-center py-5 text-xs text-stone-400 border-t border-stone-200/60 bg-white">
        {copyright}
      </footer>
    </div>
  );
}
