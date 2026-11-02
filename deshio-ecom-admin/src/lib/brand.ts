export interface Brand {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
}

const FALLBACK: Brand = { siteName: "Admin", logoUrl: "", faviconUrl: "" };

function apiBase(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1")
    .trim()
    .replace(/\/+$/, "");
  return raw.endsWith("/api/v1") ? raw : `${raw}/api/v1`;
}

/** Server-side: read brand identity from the public settings endpoint. */
export async function getBrand(): Promise<Brand> {
  try {
    const res = await fetch(`${apiBase()}/settings/seo`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return FALLBACK;
    const json = await res.json();
    const d = json?.data ?? {};
    return {
      siteName: d.siteName || FALLBACK.siteName,
      logoUrl: d.logoUrl || "",
      faviconUrl: d.faviconUrl || "",
    };
  } catch {
    return FALLBACK;
  }
}
