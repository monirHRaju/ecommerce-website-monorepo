import type { Metadata } from "next";
import CatalogView from "@/components/products/CatalogView";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const revalidate = 300;

const VALID_GENDERS = ["men", "women", "unisex", "kids"];

interface PageProps {
  params: Promise<{ gender: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { gender } = await params;
  const normalized = gender.toLowerCase();
  const label =
    normalized === "women"
      ? "Women's Collection"
      : normalized === "men"
      ? "Men's Collection"
      : normalized === "kids"
      ? "Kids' Collection"
      : "Unisex & Heritage Collection";

  return {
    title: `${label} — Deshio Fashion`,
    description: `Shop our curated ${label} featuring premium fabrics, artisanal handlooms, and contemporary cuts in Bangladesh.`,
    openGraph: {
      title: `${label} — Deshio Fashion`,
      description: `Explore ${label} at Deshio.`,
      type: "website",
    },
  };
}

export default async function GenderPage({ params, searchParams }: PageProps) {
  const { gender } = await params;
  const normalized = gender.toLowerCase();

  if (!VALID_GENDERS.includes(normalized)) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://deshio.com";
  const label =
    normalized === "women"
      ? "Women's Collection"
      : normalized === "men"
      ? "Men's Collection"
      : normalized === "kids"
      ? "Kids' Collection"
      : "Unisex & Heritage Collection";

  const breadcrumbs = [
    { name: "Home", url: `${baseUrl}` },
    { name: "Catalog", url: `${baseUrl}/products` },
    { name: label, url: `${baseUrl}/gender/${normalized}` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <CatalogView
        genderFilter={normalized}
        basePath={`/gender/${normalized}`}
        searchParams={resolvedSearchParams}
      />
    </>
  );
}
