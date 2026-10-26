import type { Metadata } from "next";
import CatalogView from "@/components/products/CatalogView";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "All Products — Curated Fashion Catalog | Deshio",
  description:
    "Explore our complete collection of luxury handlooms, festive panjabis, designer kurtis, sarees, and contemporary everyday wear in Bangladesh.",
  openGraph: {
    title: "All Products — Curated Fashion Catalog | Deshio",
    description:
      "Explore the finest collection of traditional and modern fashion in Bangladesh.",
    type: "website",
  },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  return <CatalogView searchParams={resolvedParams} basePath="/products" />;
}
