import { API_BASE } from "@/lib/api";
import { Category, Product } from "@/types";

export type HomeSectionType =
  | "new_arrival"
  | "best_selling"
  | "top_categories"
  | "featured"
  | "gender"
  | "category";

export interface HomeSectionConfig {
  key: string;
  type: HomeSectionType;
  title: string;
  enabled: boolean;
  order: number;
  limit: number;
  value?: string;
}

export interface HomeBannerConfig {
  enabled: boolean;
  image: string;
  mobileImage?: string;
  link?: string;
  alt?: string;
}

export interface HomepageConfig {
  banner: HomeBannerConfig;
  sections: HomeSectionConfig[];
}

/** Used when the API is unreachable so the homepage never renders empty. */
export const FALLBACK_HOMEPAGE: HomepageConfig = {
  banner: {
    enabled: true,
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80",
    mobileImage: "",
    link: "/products",
    alt: "Shop the latest collection",
  },
  sections: [
    { key: "new-arrival", type: "new_arrival", title: "New Arrival", enabled: true, order: 1, limit: 8 },
    { key: "top-categories", type: "top_categories", title: "Top Categories", enabled: true, order: 2, limit: 8 },
    { key: "best-selling", type: "best_selling", title: "Best Selling", enabled: true, order: 3, limit: 8 },
    { key: "mens-fashion", type: "gender", title: "Men's Fashion", enabled: true, order: 4, limit: 8, value: "men" },
  ],
};

export async function getHomepageConfig(): Promise<HomepageConfig> {
  try {
    const res = await fetch(`${API_BASE}/settings/homepage`, {
      next: { revalidate: 300, tags: ["homepage-settings"] },
    });
    if (!res.ok) return FALLBACK_HOMEPAGE;
    const json = await res.json();
    const data = json.data as HomepageConfig | null;
    if (!data) return FALLBACK_HOMEPAGE;
    return {
      banner: { ...FALLBACK_HOMEPAGE.banner, ...(data.banner ?? {}) },
      sections: Array.isArray(data.sections) ? data.sections : FALLBACK_HOMEPAGE.sections,
    };
  } catch {
    return FALLBACK_HOMEPAGE;
  }
}

/** Query string for the product API for a given section. */
function sectionQuery(section: HomeSectionConfig): string {
  switch (section.type) {
    case "new_arrival":
      return "sort=-createdAt";
    case "best_selling":
      return "sort=-sold";
    case "featured":
      return "isFeatured=true&sort=-createdAt";
    case "gender":
      return `gender=${encodeURIComponent(section.value || "")}&sort=-createdAt`;
    case "category":
      return `category=${encodeURIComponent(section.value || "")}&sort=-createdAt`;
    default:
      return "";
  }
}

/** Where the clickable section header leads (full product list for that section). */
export function getSectionLink(section: HomeSectionConfig): string {
  switch (section.type) {
    case "new_arrival":
      return "/products?sort=-createdAt";
    case "best_selling":
      return "/products?sort=-sold";
    case "featured":
      return "/products?isFeatured=true";
    case "gender":
      return `/products?gender=${encodeURIComponent(section.value || "")}`;
    case "category":
      return `/category/${encodeURIComponent(section.value || "")}`;
    case "top_categories":
      return "/categories";
    default:
      return "/products";
  }
}

export async function fetchSectionProducts(section: HomeSectionConfig): Promise<Product[]> {
  try {
    const res = await fetch(
      `${API_BASE}/products?limit=${section.limit || 8}&${sectionQuery(section)}`,
      { next: { revalidate: 300, tags: ["products", "homepage-settings"] } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      next: { revalidate: 300, tags: ["categories"] },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}
