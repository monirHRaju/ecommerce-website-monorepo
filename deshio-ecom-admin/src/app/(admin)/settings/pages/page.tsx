"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { SiteSettings } from "@/types";

export default function PagesSettingsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"about" | "contact">("about");

  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["pages-settings"],
    queryFn: async () => {
      const res = await api.get("/settings/seo");
      return res.data.data;
    },
    staleTime: 60_000,
  });

  // ── About Page States ───────────────────────────────────────────────────────
  const [aboutHeroBadge, setAboutHeroBadge] = useState("");
  const [aboutHeroTitle, setAboutHeroTitle] = useState("");
  const [aboutHeroSubtitle, setAboutHeroSubtitle] = useState("");
  const [aboutStoryBadge, setAboutStoryBadge] = useState("");
  const [aboutStoryTitle, setAboutStoryTitle] = useState("");
  const [aboutStoryParagraph1, setAboutStoryParagraph1] = useState("");
  const [aboutStoryParagraph2, setAboutStoryParagraph2] = useState("");
  const [aboutStats, setAboutStats] = useState<Array<{ value: string; label: string }>>([]);
  const [aboutPillars, setAboutPillars] = useState<Array<{ title: string; description: string }>>([]);
  const [aboutMilestones, setAboutMilestones] = useState<Array<{ year: string; title: string; description: string }>>([]);

  // ── Contact Page States ─────────────────────────────────────────────────────
  const [contactPageTitle, setContactPageTitle] = useState("");
  const [contactPageSubtitle, setContactPageSubtitle] = useState("");
  const [contactFaqs, setContactFaqs] = useState<Array<{ question: string; answer: string }>>([]);

  useEffect(() => {
    if (settings) {
      setAboutHeroBadge(settings.aboutHeroBadge || "Our Heritage & Philosophy");
      setAboutHeroTitle(settings.aboutHeroTitle || "Rooted in Craft. Tailored for Today.");
      setAboutHeroSubtitle(
        settings.aboutHeroSubtitle ||
          "Deshio was born from a simple conviction: everyday clothing in Bangladesh should honor our rich textile heritage while embracing clean, contemporary tailoring and breathable comfort."
      );
      setAboutStoryBadge(settings.aboutStoryBadge || "The Deshio Standard");
      setAboutStoryTitle(
        settings.aboutStoryTitle || "Every Thread Tells a Story of Patience & Precision"
      );
      setAboutStoryParagraph1(
        settings.aboutStoryParagraph1 ||
          "In an era of disposable fast fashion, we choose a slower, more deliberate path. Our design studio in Dhaka works hand-in-hand with generational weavers across rural Bangladesh to develop slow textiles that soften with every wash."
      );
      setAboutStoryParagraph2(
        settings.aboutStoryParagraph2 ||
          "Whether it is a festive embroidered Panjabi, a hand-woven Jamdani saree, or an everyday relaxed linen shirt, every silhouette is proportioned for effortless grace and lasting durability."
      );
      setAboutStats(
        settings.aboutStats?.length
          ? settings.aboutStats
          : [
              { value: "45K+", label: "Patrons Across Bangladesh" },
              { value: "180+", label: "Master Weavers & Artisans" },
              { value: "64", label: "Districts Delivered" },
              { value: "99.2%", label: "Fit & Quality Satisfaction" },
            ]
      );
      setAboutPillars(
        settings.aboutPillars?.length
          ? settings.aboutPillars
          : [
              {
                title: "Breathable Natural Fibers",
                description:
                  "Every garment begins with thoughtfully sourced textiles — combed organic cotton, pure linen, mulberry silk, and hand-spun muslin engineered for our tropical climate.",
              },
              {
                title: "Artisanal Heritage",
                description:
                  "We collaborate directly with weaving clusters in Tangail, Sonargaon, and Sirajganj to preserve authentic Jamdani and handloom traditions with fair artisan wages.",
              },
              {
                title: "Architectural Tailoring",
                description:
                  "Our Dhaka atelier refines every pattern through multiple fittings, ensuring clean drapes, reinforced seams, and effortless movement from morning to evening.",
              },
            ]
      );
      setAboutMilestones(
        settings.aboutMilestones?.length
          ? settings.aboutMilestones
          : [
              {
                year: "2020",
                title: "The Atelier Begins in Dhaka",
                description: "Founded with a capsule collection of 12 handloom Panjabis.",
              },
              {
                year: "2022",
                title: "Direct Weaver Partnerships",
                description: "Established partnerships with weaving communities in Tangail.",
              },
              {
                year: "Today",
                title: "A Modern Bangladeshi Wardrobe",
                description: "Blending heritage craftsmanship with minimalist modern design.",
              },
            ]
      );

      setContactPageTitle(settings.contactPageTitle || "We'd Love to Hear From You");
      setContactPageSubtitle(
        settings.contactPageSubtitle ||
          "Whether you need sizing guidance, fabric care advice, or assistance with an existing order, our Dhaka studio team is ready to assist."
      );
      setContactFaqs(
        settings.contactFaqs?.length
          ? settings.contactFaqs
          : [
              {
                question: "How long does delivery take inside and outside Dhaka?",
                answer:
                  "Orders inside Dhaka arrive within 24–48 hours. Nationwide courier deliveries across all 64 districts take 3–5 business days.",
              },
              {
                question: "Can I exchange a garment if the size doesn't fit?",
                answer:
                  "Yes! We offer a hassle-free 7-day size exchange on all unworn garments with original tags attached.",
              },
              {
                question: "What payment methods do you accept?",
                answer:
                  "We accept Cash on Delivery (COD) nationwide as well as Mobile Banking (bKash, Nagad, and Rocket).",
              },
            ]
      );
    }
  }, [settings]);

  const { mutate: saveSettings, isPending: saving } = useMutation({
    mutationFn: async () => {
      const payload = {
        aboutHeroBadge: aboutHeroBadge.trim(),
        aboutHeroTitle: aboutHeroTitle.trim(),
        aboutHeroSubtitle: aboutHeroSubtitle.trim(),
        aboutStoryBadge: aboutStoryBadge.trim(),
        aboutStoryTitle: aboutStoryTitle.trim(),
        aboutStoryParagraph1: aboutStoryParagraph1.trim(),
        aboutStoryParagraph2: aboutStoryParagraph2.trim(),
        aboutStats,
        aboutPillars,
        aboutMilestones,
        contactPageTitle: contactPageTitle.trim(),
        contactPageSubtitle: contactPageSubtitle.trim(),
        contactFaqs,
      };
      const res = await api.patch("/settings/seo", payload);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Page content settings saved successfully!");
      qc.invalidateQueries({ queryKey: ["pages-settings"] });
      qc.invalidateQueries({ queryKey: ["website-settings"] });
      qc.invalidateQueries({ queryKey: ["seo-settings"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update page settings");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Pages Content Management
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Update headlines, storytelling narrative, stats, and FAQs for the About Us and Contact Us storefront pages.
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
          <span>{saving ? "Saving Changes..." : "Save Page Content"}</span>
        </button>
      </div>

      {/* ── Tab Switcher ─────────────────────────────────────────────────── */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("about")}
          className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
            activeTab === "about"
              ? "text-brand-500 dark:text-brand-400 border-b-2 border-brand-500"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
          }`}
        >
          About Us Page Editor
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("contact")}
          className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
            activeTab === "contact"
              ? "text-brand-500 dark:text-brand-400 border-b-2 border-brand-500"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
          }`}
        >
          Contact Us & FAQs Editor
        </button>
      </div>

      {/* ── TAB 1: About Page Content ──────────────────────────────────────── */}
      {activeTab === "about" && (
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
              Hero Header Section
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Hero Tag / Badge
                </label>
                <input
                  type="text"
                  value={aboutHeroBadge}
                  onChange={(e) => setAboutHeroBadge(e.target.value)}
                  placeholder="Our Heritage & Philosophy"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Main Headline
                </label>
                <input
                  type="text"
                  value={aboutHeroTitle}
                  onChange={(e) => setAboutHeroTitle(e.target.value)}
                  placeholder="Rooted in Craft. Tailored for Today."
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Hero Subtitle / Introduction
              </label>
              <textarea
                rows={3}
                value={aboutHeroSubtitle}
                onChange={(e) => setAboutHeroSubtitle(e.target.value)}
                placeholder="Deshio was born from a simple conviction..."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500 resize-none"
              />
            </div>
          </div>

          {/* Craftsmanship Narrative */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
              Craftsmanship Story Narrative
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Story Badge
                </label>
                <input
                  type="text"
                  value={aboutStoryBadge}
                  onChange={(e) => setAboutStoryBadge(e.target.value)}
                  placeholder="The Deshio Standard"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Story Title
                </label>
                <input
                  type="text"
                  value={aboutStoryTitle}
                  onChange={(e) => setAboutStoryTitle(e.target.value)}
                  placeholder="Every Thread Tells a Story of Patience & Precision"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Story Paragraph 1
              </label>
              <textarea
                rows={3}
                value={aboutStoryParagraph1}
                onChange={(e) => setAboutStoryParagraph1(e.target.value)}
                placeholder="In an era of disposable fast fashion, we choose a slower, more deliberate path..."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Story Paragraph 2
              </label>
              <textarea
                rows={3}
                value={aboutStoryParagraph2}
                onChange={(e) => setAboutStoryParagraph2(e.target.value)}
                placeholder="Whether it is a festive embroidered Panjabi..."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500 resize-none"
              />
            </div>
          </div>

          {/* Key Figures / Stats Repeater */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Key Figures & Stats ({aboutStats.length})
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Displayed in the strip below the hero
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setAboutStats([...aboutStats, { value: "10K+", label: "New Stat Label" }])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-semibold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
              >
                + Add Stat
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {aboutStats.map((stat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center gap-3"
                >
                  <div className="w-24">
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => {
                        const updated = [...aboutStats];
                        updated[idx].value = e.target.value;
                        setAboutStats(updated);
                      }}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1.5 text-xs font-semibold text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => {
                        const updated = [...aboutStats];
                        updated[idx].label = e.target.value;
                        setAboutStats(updated);
                      }}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setAboutStats(aboutStats.filter((_, i) => i !== idx))}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer mt-4"
                    title="Remove Stat"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pillars Repeater */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Pillars / Core Values ({aboutPillars.length})
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cards highlighting your house principles
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setAboutPillars([
                    ...aboutPillars,
                    { title: "New Pillar", description: "Pillar description goes here." },
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-semibold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
              >
                + Add Pillar
              </button>
            </div>

            <div className="space-y-3">
              {aboutPillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2 relative"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                        Pillar Title
                      </label>
                      <input
                        type="text"
                        value={pillar.title}
                        onChange={(e) => {
                          const updated = [...aboutPillars];
                          updated[idx].title = e.target.value;
                          setAboutPillars(updated);
                        }}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-900 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAboutPillars(aboutPillars.filter((_, i) => i !== idx))}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer mt-4"
                      title="Remove Pillar"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                      Pillar Description
                    </label>
                    <textarea
                      rows={2}
                      value={pillar.description}
                      onChange={(e) => {
                        const updated = [...aboutPillars];
                        updated[idx].description = e.target.value;
                        setAboutPillars(updated);
                      }}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-xs text-gray-900 dark:text-white resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones Repeater */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Journey Chronicle & Milestones ({aboutMilestones.length})
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Timeline milestones displayed at the bottom of the About page
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setAboutMilestones([
                    ...aboutMilestones,
                    { year: "2026", title: "New Milestone", description: "Milestone detail." },
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-semibold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
              >
                + Add Milestone
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {aboutMilestones.map((m, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2 relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-24">
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                        Year
                      </label>
                      <input
                        type="text"
                        value={m.year}
                        onChange={(e) => {
                          const updated = [...aboutMilestones];
                          updated[idx].year = e.target.value;
                          setAboutMilestones(updated);
                        }}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-xs font-semibold text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                        Milestone Title
                      </label>
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => {
                          const updated = [...aboutMilestones];
                          updated[idx].title = e.target.value;
                          setAboutMilestones(updated);
                        }}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1 text-xs font-semibold text-gray-900 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAboutMilestones(aboutMilestones.filter((_, i) => i !== idx))}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer mt-4"
                      title="Remove Milestone"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={m.description}
                      onChange={(e) => {
                        const updated = [...aboutMilestones];
                        updated[idx].description = e.target.value;
                        setAboutMilestones(updated);
                      }}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Contact Page & FAQs Content ─────────────────────────────── */}
      {activeTab === "contact" && (
        <div className="space-y-8">
          {/* Contact Header Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
              Contact Us Page Header
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Page Headline
              </label>
              <input
                type="text"
                value={contactPageTitle}
                onChange={(e) => setContactPageTitle(e.target.value)}
                placeholder="We'd Love to Hear From You"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Page Subtitle
              </label>
              <textarea
                rows={2}
                value={contactPageSubtitle}
                onChange={(e) => setContactPageSubtitle(e.target.value)}
                placeholder="Whether you need sizing guidance, fabric care advice..."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500 resize-none"
              />
            </div>
          </div>

          {/* Dynamic FAQs Repeater */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Frequently Asked Questions ({contactFaqs.length})
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Accordions shown beside the contact form for rapid self-service answers
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setContactFaqs([
                    ...contactFaqs,
                    { question: "New Question?", answer: "Detailed answer goes here." },
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-semibold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
              >
                + Add FAQ
              </button>
            </div>

            <div className="space-y-4">
              {contactFaqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                        Question #{idx + 1}
                      </label>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => {
                          const updated = [...contactFaqs];
                          updated[idx].question = e.target.value;
                          setContactFaqs(updated);
                        }}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setContactFaqs(contactFaqs.filter((_, i) => i !== idx))}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer mt-4"
                      title="Remove FAQ"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                      Answer
                    </label>
                    <textarea
                      rows={3}
                      value={faq.answer}
                      onChange={(e) => {
                        const updated = [...contactFaqs];
                        updated[idx].answer = e.target.value;
                        setContactFaqs(updated);
                      }}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-xs text-gray-900 dark:text-white resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
