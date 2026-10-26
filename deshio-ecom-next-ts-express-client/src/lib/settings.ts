import { API_BASE } from "@/lib/api";

export interface SiteSettingsData {
  siteName?: string;
  tagline?: string;
  logoUrl?: string;
  announcementText?: string;
  showAnnouncement?: boolean;
  address?: string;
  showroomHours?: string;
  helplineHours?: string;
  contactEmail?: string;
  contactPhone?: string;
  footerDescription?: string;
  copyrightText?: string;
  contactPageTitle?: string;
  contactPageSubtitle?: string;
  contactFaqs?: Array<{ question: string; answer: string }>;
  aboutHeroBadge?: string;
  aboutHeroTitle?: string;
  aboutHeroSubtitle?: string;
  aboutStoryBadge?: string;
  aboutStoryTitle?: string;
  aboutStoryParagraph1?: string;
  aboutStoryParagraph2?: string;
  aboutStats?: Array<{ value: string; label: string }>;
  aboutPillars?: Array<{ title: string; description: string }>;
  aboutMilestones?: Array<{ year: string; title: string; description: string }>;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    pinterest?: string;
    tiktok?: string;
    whatsapp?: string;
    messenger?: string;
  };
  whatsappSupport?: string;
  messengerSupport?: string;
  showFloatingSupport?: boolean;
  siteTitle?: string;
  titleTemplate?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  twitterHandle?: string;
  googleSiteVerification?: string;
  bingSiteVerification?: string;
  indexSite?: boolean;
}

export async function getSiteSettings(): Promise<SiteSettingsData | null> {
  try {
    const res = await fetch(`${API_BASE}/settings/seo`, {
      next: { revalidate: 300, tags: ["site-settings", "seo-settings"] },
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || null;
    }
  } catch {
    // Fallback gracefully
  }
  return null;
}
