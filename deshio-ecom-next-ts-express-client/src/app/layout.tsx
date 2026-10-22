import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import Providers from "@/providers/Providers";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Deshio — Luxury & Contemporary Fashion",
    template: "%s | Deshio Fashion",
  },
  description:
    "Discover timeless elegance, premium fabrics, and contemporary fashion for men, women, and kids.",
  keywords: [
    "fashion",
    "clothing",
    "apparel",
    "menswear",
    "womenswear",
    "panjabi",
    "sarees",
    "contemporary style",
    "ecommerce",
  ],
  icons: { icon: "/deshio_logo_icon.ico" },
  openGraph: {
    title: "Deshio — Luxury & Contemporary Fashion",
    description: "Discover timeless elegance and contemporary fashion.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased bg-white text-stone-900 selection:bg-stone-900 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
