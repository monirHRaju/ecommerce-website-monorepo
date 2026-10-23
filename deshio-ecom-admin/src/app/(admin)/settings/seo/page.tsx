"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { SiteSettings } from "@/types";

export default function SeoSettingsPage() {
  const qc = useQueryClient();

  const { data: settings, isLoading, refetch } = useQuery<SiteSettings>({
    queryKey: ["seo-settings"],
    queryFn: async () => {
      const res = await api.get("/settings/seo");
      return res.data.data;
    },
    staleTime: 60_000,
  });

  // Form states
  const [siteName, setSiteName] = useState("");
  const [siteTitle, setSiteTitle] = useState("");
  const [titleTemplate, setTitleTemplate] = useState("%s | Deshio");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("https://deshio.com");
  const [ogImage, setOgImage] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("@deshio_official");
  const [googleSiteVerification, setGoogleSiteVerification] = useState("");
  const [bingSiteVerification, setBingSiteVerification] = useState("");
  const [indexSite, setIndexSite] = useState(true);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialPinterest, setSocialPinterest] = useState("");

  // Populate state when settings load
  useEffect(() => {
    if (settings) {
      setSiteName(settings.siteName || "Deshio");
      setSiteTitle(
        settings.siteTitle || "Deshio — Timeless Elegance & Contemporary Fashion"
      );
      setTitleTemplate(settings.titleTemplate || "%s | Deshio");
      setMetaDescription(settings.metaDescription || "");
      setMetaKeywords(
        Array.isArray(settings.metaKeywords)
          ? settings.metaKeywords.join(", ")
          : (settings.metaKeywords as any) || ""
      );
      setCanonicalUrl(settings.canonicalUrl || "https://deshio.com");
      setOgImage(settings.ogImage || "");
      setTwitterHandle(settings.twitterHandle || "@deshio_official");
      setGoogleSiteVerification(settings.googleSiteVerification || "");
      setBingSiteVerification(settings.bingSiteVerification || "");
      setIndexSite(settings.indexSite !== undefined ? settings.indexSite : true);
      setContactEmail(settings.contactEmail || "care@deshio.com");
      setContactPhone(settings.contactPhone || "+880 1700-000000");
      setSocialFacebook(settings.socialLinks?.facebook || "");
      setSocialInstagram(settings.socialLinks?.instagram || "");
      setSocialYoutube(settings.socialLinks?.youtube || "");
      setSocialPinterest(settings.socialLinks?.pinterest || "");
    }
  }, [settings]);

  const { mutate: saveSettings, isPending: saving } = useMutation({
    mutationFn: async () => {
      const payload = {
        siteName,
        siteTitle,
        titleTemplate,
        metaDescription,
        metaKeywords: metaKeywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        canonicalUrl,
        ogImage,
        twitterHandle,
        googleSiteVerification,
        bingSiteVerification,
        indexSite,
        contactEmail,
        contactPhone,
        socialLinks: {
          facebook: socialFacebook,
          instagram: socialInstagram,
          youtube: socialYoutube,
          pinterest: socialPinterest,
        },
      };
      const res = await api.patch("/settings/seo", payload);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("SEO settings saved successfully!");
      qc.invalidateQueries({ queryKey: ["seo-settings"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to update SEO settings"
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings();
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-900 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span>SEO & Metadata Management</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure site-wide search engine optimization, meta tags, OpenGraph previews, and indexing rules anytime.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Reload</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── 1. Google SERP Live Simulation ──────────────────────────── */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Google Search Result Preview</span>
            </h2>
            <span className="text-[11px] text-gray-400">Live Simulation</span>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 max-w-2xl font-sans">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {siteName || "Deshio"}
              </span>
              <span>›</span>
              <span className="truncate">{canonicalUrl}</span>
            </div>
            <h3 className="text-base text-blue-700 dark:text-blue-400 font-medium hover:underline cursor-pointer truncate">
              {siteTitle || "Deshio — Timeless Elegance & Contemporary Fashion"}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 leading-relaxed">
              {metaDescription ||
                "Discover curated luxury essentials, exquisite handlooms, and contemporary everyday wear in Bangladesh."}
            </p>
          </div>
        </div>

        {/* ── 2. Primary Meta & Brand Defaults ────────────────────────── */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            Primary Meta Tags & Title
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Brand / Store Name
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Deshio"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Title Template Pattern
              </label>
              <input
                type="text"
                value={titleTemplate}
                onChange={(e) => setTitleTemplate(e.target.value)}
                placeholder="%s | Deshio"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Used across category & product pages (e.g. &ldquo;Jamdani Saree | Deshio&rdquo;).
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Default Meta Title (Homepage Title)
              </label>
              <span className="text-[11px] text-gray-400">
                {siteTitle.length}/60 chars recommended
              </span>
            </div>
            <input
              type="text"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="Deshio — Timeless Elegance & Contemporary Fashion"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Default Meta Description
              </label>
              <span className="text-[11px] text-gray-400">
                {metaDescription.length}/160 chars recommended
              </span>
            </div>
            <textarea
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Brief summary of your fashion store for search engine crawlers and snippets…"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-white focus:outline-brand-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Meta Keywords (Comma separated)
            </label>
            <input
              type="text"
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              placeholder="fashion bangladesh, panjabi, jamdani saree, handloom cotton, designer wear"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Canonical Base URL
            </label>
            <input
              type="url"
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              placeholder="https://deshio.com"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
            />
          </div>
        </div>

        {/* ── 3. Indexing & Search Console ─────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            Search Engine Indexing & Verification
          </h2>

          {/* Indexing Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Search Engine Indexing (Robots.txt & meta tags)
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                When enabled, Googlebot and other crawlers are permitted to index your catalog and display search listings.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
              <input
                type="checkbox"
                checked={indexSite}
                onChange={(e) => setIndexSite(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
            </label>
          </div>

          {!indexSite && (
            <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>
                Warning: Indexing is currently disabled. All pages will output &ldquo;noindex, nofollow&rdquo; and robots.txt will block indexing.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Google Search Console Verification Tag
              </label>
              <input
                type="text"
                value={googleSiteVerification}
                onChange={(e) => setGoogleSiteVerification(e.target.value)}
                placeholder="e.g. abc123XYZ456-verificationCode"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500 font-mono text-xs"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Inserts &lt;meta name=&quot;google-site-verification&quot; content=&quot;...&quot; /&gt;
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Bing Webmaster Verification Tag
              </label>
              <input
                type="text"
                value={bingSiteVerification}
                onChange={(e) => setBingSiteVerification(e.target.value)}
                placeholder="e.g. msvalidate.01=..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* ── 4. OpenGraph & Social Sharing ────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>OpenGraph & Social Sharing (Facebook, WhatsApp, Twitter)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Default OpenGraph Image URL
              </label>
              <input
                type="url"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Optimal resolution: 1200 × 630 pixels.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Twitter / X Handle
              </label>
              <input
                type="text"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                placeholder="@deshio_official"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
              />
            </div>
          </div>

          {ogImage && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2 font-medium">Image Preview:</p>
              <div className="relative w-64 h-36 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ogImage}
                  alt="OG Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── 5. Organization Schema Data ──────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Organization Schema & Social Channels (JSON-LD)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Customer Support Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="care@deshio.com"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Customer Support Phone
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+880 1700-000000"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Facebook URL
              </label>
              <input
                type="url"
                value={socialFacebook}
                onChange={(e) => setSocialFacebook(e.target.value)}
                placeholder="https://facebook.com/deshio"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Instagram URL
              </label>
              <input
                type="url"
                value={socialInstagram}
                onChange={(e) => setSocialInstagram(e.target.value)}
                placeholder="https://instagram.com/deshio"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                YouTube URL
              </label>
              <input
                type="url"
                value={socialYoutube}
                onChange={(e) => setSocialYoutube(e.target.value)}
                placeholder="https://youtube.com/@deshio"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Pinterest URL
              </label>
              <input
                type="url"
                value={socialPinterest}
                onChange={(e) => setSocialPinterest(e.target.value)}
                placeholder="https://pinterest.com/deshio"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-brand-500"
              />
            </div>
          </div>
        </div>

        {/* ── Submit Button ────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            )}
            <span>{saving ? "Saving Changes…" : "Save SEO Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
