import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";
import { getSiteSettings } from "@/lib/settings";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage() {
  const settings = await getSiteSettings();
  return (
    <LoginForm
      brandName={settings?.siteName || siteConfig.shortName}
      brandLogo={settings?.logoUrl}
      tagline={settings?.tagline}
    />
  );
}
