"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { SiteSettings } from "@/types";

export default function WebsiteSettingsPage() {
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["website-settings"],
    queryFn: async () => {
      const res = await api.get("/settings/seo");
      return res.data.data;
    },
    staleTime: 60_000,
  });

  // Branding states
  const [siteName, setSiteName] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [announcementText, setAnnouncementText] = useState("");
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  // Contact & Atelier states
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [showroomHours, setShowroomHours] = useState("");
  const [helplineHours, setHelplineHours] = useState("");

  // Footer states
  const [footerDescription, setFooterDescription] = useState("");
  const [copyrightText, setCopyrightText] = useState("");

  useEffect(() => {
    if (settings) {
      setSiteName(settings.siteName || "Deshio");
      setTagline(settings.tagline || "Haute & Contemporary");
      setLogoUrl(settings.logoUrl || "");
      setAnnouncementText(
        settings.announcementText ||
          "Complimentary Express Shipping on Orders Above ৳2,500"
      );
      setShowAnnouncement(
        settings.showAnnouncement !== undefined
          ? settings.showAnnouncement
          : true
      );

      setContactEmail(settings.contactEmail || "care@deshio.com");
      setContactPhone(settings.contactPhone || "+880 1700-000000");
      setAddress(
        settings.address || "Road 11, Banani, Dhaka 1213, Bangladesh"
      );
      setShowroomHours(
        settings.showroomHours || "11:00 AM – 9:00 PM (Open 7 Days)"
      );
      setHelplineHours(
        settings.helplineHours || "Sat – Thu, 10:00 AM – 8:00 PM BST"
      );

      setFooterDescription(
        settings.footerDescription ||
          "Curated luxury essentials, exquisite handlooms, and contemporary everyday wear crafted from breathable, premium fabrics."
      );
      setCopyrightText(
        settings.copyrightText || "© {year} Deshio Fashion. All rights reserved."
      );
    }
  }, [settings]);

  const { mutate: saveSettings, isPending: saving } = useMutation({
    mutationFn: async () => {
      const payload = {
        siteName: siteName.trim(),
        tagline: tagline.trim(),
        logoUrl: logoUrl.trim(),
        announcementText: announcementText.trim(),
        showAnnouncement,
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        address: address.trim(),
        showroomHours: showroomHours.trim(),
        helplineHours: helplineHours.trim(),
        footerDescription: footerDescription.trim(),
        copyrightText: copyrightText.trim(),
      };
      const res = await api.patch("/settings/seo", payload);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Website & branding settings saved successfully!");
      qc.invalidateQueries({ queryKey: ["website-settings"] });
      qc.invalidateQueries({ queryKey: ["seo-settings"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to update website settings"
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const renderedCopyright = (copyrightText || "© {year} Deshio Fashion.").replace(
    "{year}",
    String(currentYear)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Website Information & Branding
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Update store identity, brand logo, top announcement bar, contact details, and footer text across the entire storefront.
          </p>
        </div>

        <button
          onClick={() => saveSettings()}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 self-start sm:self-auto cursor-pointer"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span>{saving ? "Saving Changes..." : "Save Website Settings"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Form Column (7 cols) ───────────────────────────────── */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Branding Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
              1. Brand Identity & Header
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Brand / Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g. Deshio"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Tagline / Sub-motto
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Haute & Contemporary"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Brand Logo Image URL (Optional)
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Leave empty to display the stylized text logo automatically.
              </p>
            </div>

            {/* Announcement Bar Settings */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Header Announcement Bar
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Top notification strip displayed above the navbar
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAnnouncement}
                    onChange={(e) => setShowAnnouncement(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500" />
                </label>
              </div>

              {showAnnouncement && (
                <div>
                  <input
                    type="text"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="e.g. Complimentary Express Shipping on Orders Above ৳2,500"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 2. Contact & Atelier Information Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
              2. Contact & Atelier Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Helpline / Phone Number
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+880 1700-000000"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Customer Care Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="care@deshio.com"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Physical Atelier / Showroom Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Road 11, Banani, Dhaka 1213, Bangladesh"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Showroom Opening Hours
                </label>
                <input
                  type="text"
                  value={showroomHours}
                  onChange={(e) => setShowroomHours(e.target.value)}
                  placeholder="11:00 AM – 9:00 PM (Open 7 Days)"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Helpline Support Hours
                </label>
                <input
                  type="text"
                  value={helplineHours}
                  onChange={(e) => setHelplineHours(e.target.value)}
                  placeholder="Sat – Thu, 10:00 AM – 8:00 PM BST"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Footer Information Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
              3. Storefront Footer Configuration
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Footer Brand Synopsis
              </label>
              <textarea
                rows={3}
                value={footerDescription}
                onChange={(e) => setFooterDescription(e.target.value)}
                placeholder="Curated luxury essentials, exquisite handlooms, and contemporary everyday wear..."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Copyright Text Template
              </label>
              <input
                type="text"
                value={copyrightText}
                onChange={(e) => setCopyrightText(e.target.value)}
                placeholder="© {year} Deshio Fashion. All rights reserved."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Tip: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[11px]">&#123;year&#125;</code> will dynamically render the current year ({currentYear}).
              </p>
            </div>
          </div>
        </div>

        {/* ── Right Column: Live Simulation Previews (5 cols) ─────────── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header Preview */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
              Header Simulation Preview
            </h3>

            {showAnnouncement && announcementText && (
              <div className="bg-stone-900 text-stone-200 text-[10px] font-medium tracking-wider uppercase py-1.5 px-3 text-center rounded-lg">
                {announcementText}
              </div>
            )}

            <div className="p-4 rounded-xl bg-stone-50/80 dark:bg-gray-800/50 border border-stone-200/80 dark:border-gray-700 flex items-center justify-between">
              <div>
                {logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={logoUrl}
                    alt={siteName}
                    className="h-9 w-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex flex-col">
                    <span className="font-serif text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
                      {siteName || "Brand Name"}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest font-semibold text-stone-500 dark:text-gray-400 -mt-1">
                      {tagline || "Tagline"}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-[11px] text-gray-400">Navigation...</span>
            </div>
          </div>

          {/* Footer Preview */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
              Footer Simulation Preview
            </h3>

            <div className="p-5 rounded-xl bg-stone-50 dark:bg-gray-800/50 border border-stone-200 dark:border-gray-700 space-y-3 text-xs text-stone-600 dark:text-gray-300">
              <div>
                <p className="font-serif text-lg font-bold text-stone-900 dark:text-white">
                  {siteName || "Deshio"}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
                  {tagline || "Haute & Contemporary"}
                </p>
              </div>

              <p className="text-[11px] leading-relaxed text-stone-500 dark:text-gray-400">
                {footerDescription || "Curated luxury essentials..."}
              </p>

              <div className="pt-2 border-t border-stone-200 dark:border-gray-700 space-y-1 text-[11px]">
                <p className="text-stone-700 dark:text-stone-300 font-medium">{address}</p>
                <p>Helpline: <span className="font-mono">{contactPhone}</span></p>
                <p>Email: <span className="font-mono">{contactEmail}</span></p>
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-gray-700 text-[10px] text-stone-400">
                {renderedCopyright}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
