"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Brand } from "@/lib/brand";

export function useBrand(): Brand & { isLoading: boolean } {
  const { data, isLoading } = useQuery<Brand>({
    queryKey: ["brand"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await api.get("/settings/seo");
      const d = res.data?.data ?? {};
      return {
        siteName: d.siteName || "Admin",
        logoUrl: d.logoUrl || "",
        faviconUrl: d.faviconUrl || "",
      };
    },
  });
  return {
    siteName: data?.siteName ?? "Admin",
    logoUrl: data?.logoUrl ?? "",
    faviconUrl: data?.faviconUrl ?? "",
    isLoading,
  };
}

interface BrandLogoProps {
  className?: string;
  /** Height class applied to the image, e.g. "h-10" */
  imgClassName?: string;
  textClassName?: string;
  /** Show only the icon/first letter (collapsed sidebar) */
  compact?: boolean;
}

/** Brand logo from settings; falls back to the site name as text. */
export default function BrandLogo({
  className = "",
  imgClassName = "h-10 w-auto max-w-[180px] object-contain",
  textClassName = "text-xl font-bold text-gray-900 dark:text-white",
  compact = false,
}: BrandLogoProps) {
  const { siteName, logoUrl, faviconUrl, isLoading } = useBrand();

  if (isLoading) {
    return <span className={`inline-block h-8 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-800 ${className}`} />;
  }

  const src = compact ? faviconUrl || logoUrl : logoUrl;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${siteName} Admin`}
        className={`${compact ? "h-9 w-9 rounded-lg object-cover" : imgClassName} ${className}`}
      />
    );
  }

  return (
    <span className={`${textClassName} ${className}`}>
      {compact ? siteName.charAt(0).toUpperCase() : siteName}
    </span>
  );
}
