import React from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import NewsletterForm from "./NewsletterForm";
import { ShieldCheck, Truck, RefreshCw, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-stone-50 border-t border-stone-200">
      {/* Editorial Trust Ribbon */}
      <div className="border-b border-stone-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-900">Premium Fabrics</p>
                <p className="text-xs text-stone-500">100% genuine quality</p>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <Truck className="w-5 h-5 text-stone-800 shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-900">Swift Delivery</p>
                <p className="text-xs text-stone-500">Inside & outside Dhaka</p>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <RefreshCw className="w-5 h-5 text-stone-800 shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-900">Hassle-Free Exchange</p>
                <p className="text-xs text-stone-500">7 days trial period</p>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <ShieldCheck className="w-5 h-5 text-stone-800 shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-900">Secure Checkout</p>
                <p className="text-xs text-stone-500">COD, bKash & Cards</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Brand Column (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-serif text-2xl font-bold tracking-tight text-stone-900">
                {siteConfig.shortName}
              </span>
              <span className="block text-[10px] tracking-widest uppercase font-semibold text-stone-500">
                Haute & Contemporary
              </span>
            </Link>
            <p className="text-sm text-stone-600 leading-relaxed font-light max-w-sm">
              {siteConfig.description}
            </p>
            <div className="pt-2 text-xs text-stone-500 space-y-1">
              <p>{siteConfig.contact.address}</p>
              <p>Helpline: {siteConfig.contact.phone}</p>
              <p>Email: {siteConfig.contact.email}</p>
            </div>
          </div>

          {/* Collections Column (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-900">
              Collections
            </p>
            <ul className="space-y-2 text-sm">
              {siteConfig.footerLinks.collections.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-stone-600 hover:text-stone-900 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care Column (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-900">
              Customer Care
            </p>
            <ul className="space-y-2 text-sm">
              {siteConfig.footerLinks.customerCare.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-stone-600 hover:text-stone-900 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Column (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-900">
              The Fashion Edit
            </p>
            <p className="text-xs text-stone-600 leading-relaxed">
              Subscribe to receive preview access to limited seasonal drops, private sales, and sartorial inspirations.
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-stone-900 transition-colors">About Us</Link>
            <Link href="/track-order" className="hover:text-stone-900 transition-colors">Track Order</Link>
            <Link href="/contact" className="hover:text-stone-900 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
