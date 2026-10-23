import type { Metadata } from "next";
import CatalogView from "@/components/products/CatalogView";
import { API_BASE } from "@/lib/api";
import { Category } from "@/types";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  let categoryName = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  try {
    const res = await fetch(`${API_BASE}/categories`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const json = await res.json();
      const match = (json.data as Category[]).find((c) => c.slug === slug);
      if (match) categoryName = match.name;
    }
  } catch {
    // fallback to formatted slug
  }

  return {
    title: `${categoryName} — Deshio Fashion`,
    description: `Shop our exclusive ${categoryName} collection crafted from premium fabrics with nationwide delivery across Bangladesh.`,
    openGraph: {
      title: `${categoryName} — Deshio Fashion`,
      description: `Discover curated ${categoryName} at Deshio.`,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <CatalogView
      categorySlug={slug}
      basePath={`/category/${slug}`}
      searchParams={resolvedSearchParams}
    />
  );
}
