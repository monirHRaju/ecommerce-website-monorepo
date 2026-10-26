import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Studio Concierge — Deshio Fashion",
  description:
    "Connect with our Dhaka studio concierge for sizing guidance, custom handloom orders, or delivery inquiries across Bangladesh.",
  openGraph: {
    title: "Contact Deshio — Studio Concierge & Customer Care",
    description:
      "Reach our Dhaka team for garment sizing advice, exchange support, or bespoke inquiries.",
    type: "website",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
