import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import Providers from "@/providers/Providers";
import { OrganizationJsonLd } from "@/components/seo/JsonLd";
import { API_BASE } from "@/lib/api";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

async function getSeoSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings/seo`, {
      next: { revalidate: 300, tags: ["seo-settings"] },
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || null;
    }
  } catch {
    // Fallback gracefully
  }
  return null;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSeoSettings();

  const siteName = settings?.siteName || "Deshio";
  const siteTitle =
    settings?.siteTitle || "Deshio — Timeless Elegance & Contemporary Fashion";
  const titleTemplate = settings?.titleTemplate || `%s | ${siteName}`;
  const description =
    settings?.metaDescription ||
    "Discover curated luxury essentials, exquisite handlooms, and contemporary everyday wear in Bangladesh.";
  const canonicalUrl = settings?.canonicalUrl || "https://deshio.com";
  const ogImage =
    settings?.ogImage ||
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80";

  return {
    metadataBase: new URL(canonicalUrl),
    title: {
      default: siteTitle,
      template: titleTemplate,
    },
    description,
    keywords: settings?.metaKeywords || [
      "fashion bangladesh",
      "panjabi online",
      "jamdani saree",
      "handloom cotton",
      "mens fashion dhaka",
      "womens kurti",
      "deshio fashion",
    ],
    icons: { icon: "/deshio_logo_icon.ico" },
    robots:
      settings?.indexSite === false
        ? { index: false, follow: false }
        : { index: true, follow: true },
    verification: {
      google: settings?.googleSiteVerification || undefined,
      other: settings?.bingSiteVerification
        ? { "msvalidate.01": settings.bingSiteVerification }
        : undefined,
    },
    openGraph: {
      title: siteTitle,
      description,
      url: canonicalUrl,
      siteName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteName }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description,
      images: [ogImage],
      creator: settings?.twitterHandle || "@deshio_official",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSeoSettings();
  const siteName = settings?.siteName || "Deshio";
  const canonicalUrl = settings?.canonicalUrl || "https://deshio.com";
  const socialList = settings?.socialLinks
    ? Object.values(settings.socialLinks as Record<string, string>).filter(Boolean)
    : [];

  return (
    <html lang="en" className={`${playfair.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased bg-white text-stone-900 selection:bg-stone-900 selection:text-white">
        <OrganizationJsonLd
          siteName={siteName}
          url={canonicalUrl}
          contactEmail={settings?.contactEmail}
          contactPhone={settings?.contactPhone}
          socialLinks={socialList}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
