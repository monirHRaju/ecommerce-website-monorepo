import { getSiteSettings } from "@/lib/settings";
import { WebSiteJsonLd } from "@/components/seo/JsonLd";
import HomeBanner from "@/components/home/HomeBanner";
import HomeSection from "@/components/home/HomeSection";
import TopCategories from "@/components/home/TopCategories";
import {
  fetchCategories,
  fetchSectionProducts,
  getHomepageConfig,
  getSectionLink,
} from "@/lib/homepage";

export const revalidate = 300;

export default async function HomePage() {
  const siteSettings = await getSiteSettings();
  const config = await getHomepageConfig();
  const sections = config.sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  const needsCategories = sections.some((s) => s.type === "top_categories");
  const [categories, productLists] = await Promise.all([
    needsCategories ? fetchCategories() : Promise.resolve([]),
    Promise.all(
      sections.map((s) => (s.type === "top_categories" ? Promise.resolve([]) : fetchSectionProducts(s)))
    ),
  ]);

  const canonicalUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://deshio.com";

  return (
    <div className="bg-white pb-4">
      <WebSiteJsonLd siteName={siteSettings?.siteName || "Store"} url={canonicalUrl} />

      <HomeBanner banner={config.banner} />

      {sections.map((section, i) =>
        section.type === "top_categories" ? (
          <TopCategories
            key={section.key}
            title={section.title}
            href={getSectionLink(section)}
            categories={categories.slice(0, section.limit)}
          />
        ) : (
          <HomeSection
            key={section.key}
            title={section.title}
            href={getSectionLink(section)}
            products={productLists[i]}
          />
        )
      )}
    </div>
  );
}
