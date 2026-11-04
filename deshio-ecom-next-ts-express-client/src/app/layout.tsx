import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Poppins } from "next/font/google";
import Providers from "@/providers/Providers";
import FloatingSupport from "@/components/support/FloatingSupport";
import TrackingScripts from "@/components/tracking/TrackingScripts";
import { OrganizationJsonLd } from "@/components/seo/JsonLd";
import { getSiteSettings, getTrackingConfig } from "@/lib/settings";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const siteName = settings?.siteName || siteConfig.shortName;
  const siteTitle =
    settings?.siteTitle || siteName;
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
    ],
    icons: {
      icon: settings?.faviconUrl || settings?.logoUrl || "/favicon.ico",
      apple: settings?.faviconUrl || settings?.logoUrl || undefined,
    },
    robots:
      settings?.indexSite === false
        ? { index: false, follow: false }
        : { index: true, follow: true },
    verification: {
      google: settings?.googleSiteVerification || undefined,
      other: {
        ...(settings?.bingSiteVerification
          ? { "msvalidate.01": settings.bingSiteVerification }
          : {}),
        ...(settings?.facebookDomainVerification
          ? { "facebook-domain-verification": settings.facebookDomainVerification }
          : {}),
      },
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
      creator: settings?.twitterHandle || undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [settings, trackingConfig] = await Promise.all([
    getSiteSettings(),
    getTrackingConfig(),
  ]);
  const siteName = settings?.siteName || siteConfig.shortName;
  const canonicalUrl = settings?.canonicalUrl || "https://deshio.com";
  const socialList = settings?.socialLinks
    ? Object.values(settings.socialLinks as Record<string, string>).filter(Boolean)
    : [];

  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-sans antialiased bg-white text-stone-900 selection:bg-stone-900 selection:text-white">
        <OrganizationJsonLd
          siteName={siteName}
          url={canonicalUrl}
          logo={settings?.logoUrl}
          contactEmail={settings?.contactEmail}
          contactPhone={settings?.contactPhone}
          socialLinks={socialList}
        />
        <Suspense fallback={null}>
          <TrackingScripts config={trackingConfig} />
        </Suspense>
        <Providers>{children}</Providers>
        <FloatingSupport
          whatsapp={settings?.whatsappSupport || settings?.socialLinks?.whatsapp}
          messenger={settings?.messengerSupport || settings?.socialLinks?.messenger}
          enabled={settings?.showFloatingSupport !== false}
        />
      </body>
    </html>
  );
}
