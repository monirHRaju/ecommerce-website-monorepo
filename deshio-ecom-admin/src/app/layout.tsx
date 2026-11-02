import type { Metadata } from "next";
import { getBrand } from "@/lib/brand";
import { Outfit } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import QueryProvider from "@/providers/QueryProvider";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  const icon = brand.faviconUrl || brand.logoUrl || "/images/favicon.ico";
  return {
    title: {
      default: `${brand.siteName} Admin`,
      template: `%s | ${brand.siteName} Admin`,
    },
    icons: { icon },
  };
}

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <AuthProvider>
            <QueryProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
