import Image from "next/image";
import Link from "next/link";
import type { HomeBannerConfig } from "@/lib/homepage";

export default function HomeBanner({ banner }: { banner: HomeBannerConfig }) {
  if (!banner?.enabled || !banner.image) return null;

  const hasMobile = Boolean(banner.mobileImage);
  const alt = banner.alt || "Banner";

  const media = (
    <div className="relative w-full aspect-[16/9] sm:aspect-[16/6] bg-stone-100 overflow-hidden">
      {hasMobile ? (
        <>
          <Image
            src={banner.mobileImage!}
            alt={alt}
            fill
            priority
            sizes="100vw"
            className="object-cover sm:hidden"
            unoptimized
          />
          <Image
            src={banner.image}
            alt={alt}
            fill
            priority
            sizes="100vw"
            className="object-cover hidden sm:block"
            unoptimized
          />
        </>
      ) : (
        <Image
          src={banner.image}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          unoptimized
        />
      )}
    </div>
  );

  return banner.link ? (
    <Link href={banner.link} className="block" aria-label={alt}>
      {media}
    </Link>
  ) : (
    media
  );
}
