import React from "react";
import { Product } from "@/types";

interface OrganizationJsonLdProps {
  siteName: string;
  url: string;
  logo?: string;
  contactEmail?: string;
  contactPhone?: string;
  socialLinks?: string[];
}

export function OrganizationJsonLd({
  siteName,
  url,
  logo,
  contactEmail,
  contactPhone,
  socialLinks = [],
}: OrganizationJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url,
    logo: logo || `${url}/deshio_logo_icon.ico`,
    contactPoint: contactPhone
      ? [
          {
            "@type": "ContactPoint",
            telephone: contactPhone,
            contactType: "customer service",
            email: contactEmail,
            areaServed: "BD",
            availableLanguage: ["en", "bn"],
          },
        ]
      : undefined,
    sameAs: socialLinks.filter(Boolean),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface WebSiteJsonLdProps {
  siteName: string;
  url: string;
}

export function WebSiteJsonLd({ siteName, url }: WebSiteJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ProductJsonLdProps {
  product: Product;
  url: string;
}

export function ProductJsonLd({ product, url }: ProductJsonLdProps) {
  const isOutOfStock = product.stock === 0;
  const brandName = product.brand || "Deshio";
  const categoryName =
    typeof product.category === "object" ? product.category?.name : undefined;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images || [],
    description: product.description,
    category: categoryName,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "BDT",
      price: product.price,
      itemCondition: "https://schema.org/NewCondition",
      availability: isOutOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Deshio",
      },
    },
    aggregateRating:
      product.reviewCount && product.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          }
        : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
