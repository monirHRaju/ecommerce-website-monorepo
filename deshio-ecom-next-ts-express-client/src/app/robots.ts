import { MetadataRoute } from "next";
import { API_BASE } from "@/lib/api";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  let indexSite = true;
  let canonicalUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://deshio.com";

  try {
    const res = await fetch(`${API_BASE}/settings/seo`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data?.indexSite === false) {
        indexSite = false;
      }
      if (json.data?.canonicalUrl) {
        canonicalUrl = json.data.canonicalUrl;
      }
    }
  } catch {
    // Fallback gracefully
  }

  if (!indexSite) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      sitemap: `${canonicalUrl}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/checkout",
          "/dashboard/",
          "/auth/",
          "/cart",
          "/verify-email",
          "/reset-password",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: `${canonicalUrl}/sitemap.xml`,
  };
}
