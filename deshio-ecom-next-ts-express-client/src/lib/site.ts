export const siteConfig = {
  name: "Deshio Fashion",
  shortName: "Deshio",
  tagline: "Timeless Elegance, Modern Expression",
  description:
    "Curated luxury fashion, artisan handlooms, and contemporary essentials for men, women, and kids.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  currency: {
    symbol: "৳",
    code: "BDT",
  },
  contact: {
    email: "care@deshiofashion.com",
    phone: "+880 1700-000000",
    address: "Road 11, Banani / Gulshan-2, Dhaka 1213, Bangladesh",
    hours: "10:00 AM - 9:00 PM, Every day",
  },
  socials: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "Facebook", href: "https://facebook.com" },
    { label: "Pinterest", href: "https://pinterest.com" },
  ],
  navigation: [
    { label: "New Arrivals", href: "/products?sort=-createdAt" },
    { label: "Women", href: "/products?gender=women" },
    { label: "Men", href: "/products?gender=men" },
    { label: "Kids", href: "/products?gender=kids" },
    { label: "Sale", href: "/products?sort=-discount", highlight: true },
  ],
  footerLinks: {
    collections: [
      { label: "Women's Collection", href: "/products?gender=women" },
      { label: "Men's Collection", href: "/products?gender=men" },
      { label: "Kids & Teens", href: "/products?gender=kids" },
      { label: "Traditional & Sarees", href: "/products?category=sarees" },
      { label: "Seasonal Sale", href: "/products?sort=-discount" },
    ],
    customerCare: [
      { label: "Track Your Order", href: "/track-order" },
      { label: "Shipping Policy", href: "/contact#shipping" },
      { label: "Exchange & Returns", href: "/contact#returns" },
      { label: "Help & FAQ", href: "/contact" },
    ],
    about: [
      { label: "Our Story", href: "/about" },
      { label: "Fabric & Craftsmanship", href: "/about" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
};
